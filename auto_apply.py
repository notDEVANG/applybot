import json
import logging
import argparse
import os
import time
from datetime import datetime
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

load_dotenv()

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# APPLICATION LOG — tracks every apply attempt
# ─────────────────────────────────────────────
APPLICATION_LOG = "application_log.json"


def load_application_log():
    """Load existing application log to avoid re-applying."""
    if os.path.exists(APPLICATION_LOG):
        with open(APPLICATION_LOG, "r") as f:
            return json.load(f)
    return []


def save_application_log(log_data):
    """Save application log."""
    with open(APPLICATION_LOG, "w") as f:
        json.dump(log_data, f, indent=2)


def already_applied(url, log_data):
    """Check if we already applied to this job."""
    return any(entry["url"] == url for entry in log_data)


# ─────────────────────────────────────────────
# INTERNSHALA LOGIN
# ─────────────────────────────────────────────
def login_internshala(page, email, password):
    """Log into Internshala account."""
    log.info("Logging into Internshala...")
    page.goto("https://internshala.com/login/student")
    page.wait_for_timeout(2000)

    try:
        page.fill("#email", email)
        page.fill("#password", password)
        page.click("#login_submit")
        page.wait_for_timeout(3000)

        # Check if login was successful
        if "dashboard" in page.url or "internshala.com/student" in page.url:
            log.info("✅ Login successful!")
            return True
        else:
            # Try checking for error message
            error = page.query_selector(".alert-danger")
            if error:
                log.error(f"Login failed: {error.inner_text()}")
            else:
                log.info("✅ Login appears successful!")
            return True

    except PlaywrightTimeout:
        log.error("Login page timed out")
        return False


# ─────────────────────────────────────────────
# APPLY TO A SINGLE INTERNSHALA JOB
# ─────────────────────────────────────────────
def apply_to_internshala_job(page, job, resume_path, cover_letter_text):
    """Apply to a single Internshala job listing."""
    url = job["url"]
    title = job["title"]
    company = job["company"]

    log.info(f"Applying to: {title} @ {company}")
    log.info(f"URL: {url}")

    try:
        page.goto(url)
        page.wait_for_timeout(2000)

        # ── Step 1: Click Apply button ──
        apply_btn = page.query_selector("#apply_button") or \
                    page.query_selector(".apply_button") or \
                    page.query_selector("button:has-text('Apply')")

        if not apply_btn:
            log.warning(f"No apply button found for: {title}")
            return "skipped", "No apply button found"

        apply_btn.click()
        page.wait_for_timeout(2000)

        # ── Step 2: Fill cover letter if field exists ──
        cover_field = page.query_selector("#cover_letter") or \
                      page.query_selector("textarea[name='cover_letter']") or \
                      page.query_selector(".cover_letter_textarea")

        if cover_field:
            cover_field.fill(cover_letter_text)
            log.info("✅ Cover letter filled")
            page.wait_for_timeout(500)

        # ── Step 3: Answer screening questions if present ──
        questions = page.query_selector_all(".assessment_question textarea")
        for i, q in enumerate(questions):
            q.fill(f"I have relevant experience and skills for this role. I am a quick learner and highly motivated.")
            log.info(f"✅ Answered screening question {i+1}")
            page.wait_for_timeout(300)

        # ── Step 4: Submit application ──
        submit_btn = page.query_selector("#submit") or \
                     page.query_selector("button[type='submit']") or \
                     page.query_selector("button:has-text('Submit')")

        if not submit_btn:
            log.warning("No submit button found")
            return "skipped", "No submit button found"

        # ── SAFETY: Don't actually click submit in test mode ──
        # submit_btn.click()
        # page.wait_for_timeout(2000)

        log.info(f"✅ [DRY RUN] Would have submitted application for: {title}")
        return "dry_run", "Application ready - submit button found (dry run mode)"

    except PlaywrightTimeout:
        log.error(f"Timeout while applying to: {title}")
        return "failed", "Page timeout"
    except Exception as e:
        log.error(f"Error applying to {title}: {e}")
        return "failed", str(e)


# ─────────────────────────────────────────────
# GENERATE COVER LETTER USING GROQ
# ─────────────────────────────────────────────
def generate_cover_letter(resume, job):
    """Generate a personalized cover letter using Groq."""
    from groq import Groq

    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    prompt = f"""
Write a short, professional cover letter (3 paragraphs, max 150 words) for this job application.

Candidate: {resume.get('name')}
Summary: {resume.get('summary')}
Skills: {', '.join(resume.get('skills', []))}
Experience: {resume.get('experience', [{}])[0].get('role')} at {resume.get('experience', [{}])[0].get('company')}

Job: {job.get('title')} at {job.get('company')}

Write in first person. Be specific, confident, and concise. No fluff.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content.strip()


# ─────────────────────────────────────────────
# MAIN AUTO APPLY FUNCTION
# ─────────────────────────────────────────────
def auto_apply(matched_jobs_path, resume_path, resume_json_path,
               email, password, min_score=60, max_applies=5, dry_run=True):
    """
    Main auto-apply function.

    Args:
        matched_jobs_path: Path to matched_jobs.json from Phase 3
        resume_path: Path to your PDF resume
        resume_json_path: Path to parsed resume JSON from Phase 1
        email: Internshala login email
        password: Internshala login password
        min_score: Minimum match score to apply (default: 60)
        max_applies: Maximum applications to send in one run (default: 5)
        dry_run: If True, goes through the process but doesn't actually submit
    """

    # Load matched jobs
    with open(matched_jobs_path, "r") as f:
        all_jobs = json.load(f)

    # Load resume JSON for cover letter generation
    with open(resume_json_path, "r") as f:
        resume = json.load(f)

    # Load application log
    app_log = load_application_log()
    already_applied_urls = {entry["url"] for entry in app_log}

    # Filter: only Internshala jobs above score threshold, not already applied
    eligible_jobs = [
        j for j in all_jobs
        if j.get("match_score", 0) >= min_score
        and j.get("source") == "internshala"
        and j.get("url") not in already_applied_urls
    ]

    log.info(f"Total matched jobs: {len(all_jobs)}")
    log.info(f"Eligible for auto-apply (score >= {min_score}, Internshala only): {len(eligible_jobs)}")
    log.info(f"Max applications this run: {max_applies}")
    log.info(f"Dry run mode: {dry_run}")

    if not eligible_jobs:
        log.warning("No eligible jobs found. Try lowering --min-score or running the scraper again.")
        return

    # Limit to max_applies
    jobs_to_apply = eligible_jobs[:max_applies]

    results = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # headless=False so you can watch it
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        page = context.new_page()

        # Login
        login_success = login_internshala(page, email, password)
        if not login_success:
            log.error("Could not log in. Stopping.")
            browser.close()
            return

        # Apply to each job
        for i, job in enumerate(jobs_to_apply):
            log.info(f"\n--- Job {i+1}/{len(jobs_to_apply)} ---")

            # Generate personalized cover letter
            log.info("Generating cover letter...")
            try:
                cover_letter = generate_cover_letter(resume, job)
                log.info("✅ Cover letter generated")
            except Exception as e:
                log.warning(f"Cover letter generation failed: {e}")
                cover_letter = f"I am excited to apply for the {job.get('title')} position at {job.get('company')}. My background in Python, Django, and REST APIs makes me a strong fit for this role."

            # Apply
            status, message = apply_to_internshala_job(
                page, job, resume_path, cover_letter
            )

            # Log result
            result = {
                "url": job["url"],
                "title": job["title"],
                "company": job["company"],
                "match_score": job["match_score"],
                "status": status,
                "message": message,
                "cover_letter": cover_letter,
                "applied_at": datetime.now().isoformat()
            }
            results.append(result)
            app_log.append(result)

            # Print result
            emoji = "✅" if status in ["applied", "dry_run"] else "⚠️" if status == "skipped" else "❌"
            print(f"{emoji} {status.upper()}: {job['title']} @ {job['company']}")
            print(f"   Score: {job['match_score']}/100")
            print(f"   {message}")

            # Save log after each application (safe in case of crash)
            save_application_log(app_log)

            time.sleep(2)  # pause between applications

        browser.close()

    # Final summary
    print("\n" + "="*60)
    print("📊 AUTO-APPLY SESSION SUMMARY")
    print("="*60)
    applied = [r for r in results if r["status"] in ["applied", "dry_run"]]
    failed = [r for r in results if r["status"] == "failed"]
    skipped = [r for r in results if r["status"] == "skipped"]
    print(f"✅ Applied/Dry run: {len(applied)}")
    print(f"⚠️  Skipped:        {len(skipped)}")
    print(f"❌ Failed:          {len(failed)}")
    print(f"📁 Full log saved to: {APPLICATION_LOG}")
    print("="*60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Auto-apply bot for ApplyBot India")
    parser.add_argument("--matched-jobs", required=True, help="Path to matched_jobs.json from Phase 3")
    parser.add_argument("--resume-pdf", required=True, help="Path to your PDF resume")
    parser.add_argument("--resume-json", required=True, help="Path to parsed resume JSON from Phase 1")
    parser.add_argument("--email", default=os.environ.get("INTERNSHALA_EMAIL"), help="Internshala email")
    parser.add_argument("--password", default=os.environ.get("INTERNSHALA_PASSWORD"), help="Internshala password")
    parser.add_argument("--min-score", type=int, default=60, help="Minimum match score to apply (default: 60)")
    parser.add_argument("--max-applies", type=int, default=5, help="Max applications per run (default: 5)")
    parser.add_argument("--live", action="store_true", help="Actually submit applications (default is dry run)")
    args = parser.parse_args()

    # Validate
    for path in [args.matched_jobs, args.resume_pdf, args.resume_json]:
        if not os.path.exists(path):
            log.error(f"File not found: {path}")
            exit(1)

    if not args.email or not args.password:
        log.error("Missing Internshala credentials!")
        log.error("Add to .env: INTERNSHALA_EMAIL=your@email.com")
        log.error("Add to .env: INTERNSHALA_PASSWORD=yourpassword")
        exit(1)

    auto_apply(
        matched_jobs_path=args.matched_jobs,
        resume_path=args.resume_pdf,
        resume_json_path=args.resume_json,
        email=args.email,
        password=args.password,
        min_score=args.min_score,
        max_applies=args.max_applies,
        dry_run=not args.live
    )

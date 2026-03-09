import requests
import json
import logging
import argparse
import os
import time
from datetime import datetime
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-US,en;q=0.9",
}


# ─────────────────────────────────────────────
# SOURCE 1: INTERNSHALA (Playwright)
# ─────────────────────────────────────────────
def scrape_internshala_playwright(keyword, pages=2):
    """
    Scrape Internshala job listings using Playwright.
    No login required — only reads public job listing pages.
    """
    jobs = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = context.new_page()

        for page_num in range(1, pages + 1):
            url = f"https://internshala.com/jobs/{keyword.lower().replace(' ', '-')}-jobs/page-{page_num}"
            log.info(f"[Internshala] Scraping: {url}")

            try:
                page.goto(url, timeout=15000)
                # Wait for job cards to load
                page.wait_for_timeout(3000)

                # Try to find job cards — Internshala uses different selectors
                # We'll try multiple possible selectors
                selectors = [
                    ".job-internship-card",
                    ".individual_internship",
                    "[id^='job-']",
                    ".internship_list_container > div",
                ]

                cards = []
                for selector in selectors:
                    cards = page.query_selector_all(selector)
                    if cards:
                        log.info(f"[Internshala] Found {len(cards)} cards with selector: {selector}")
                        break

                if not cards:
                    log.warning(f"[Internshala] No job cards found on page {page_num} for '{keyword}'")
                    # Try to get page title to confirm we're on the right page
                    title = page.title()
                    log.info(f"[Internshala] Page title: {title}")
                    continue

                for card in cards:
                    try:
                        # Extract all text and links from the card
                        title_el = card.query_selector(".job-title-href, .profile, h3 a, .heading_4_5")
                        company_el = card.query_selector(".company-name, .heading_6")
                        location_el = card.query_selector(".location-name, .locations span")
                        salary_el = card.query_selector(".salary, .stipend")
                        link_el = card.query_selector("a.job-title-href, a.view_detail_button, h3 a")

                        title_text = title_el.inner_text().strip() if title_el else "N/A"
                        company_text = company_el.inner_text().strip() if company_el else "N/A"
                        location_text = location_el.inner_text().strip() if location_el else "N/A"
                        salary_text = salary_el.inner_text().strip() if salary_el else "N/A"
                        job_url = "https://internshala.com" + link_el.get_attribute("href") if link_el else "N/A"

                        if title_text != "N/A":
                            jobs.append({
                                "title": title_text,
                                "company": company_text,
                                "location": location_text,
                                "salary": salary_text,
                                "url": job_url,
                                "tags": [keyword],
                                "keyword": keyword,
                                "source": "internshala",
                                "scraped_at": datetime.now().isoformat()
                            })

                    except Exception as e:
                        log.warning(f"[Internshala] Error parsing card: {e}")
                        continue

                log.info(f"[Internshala] Page {page_num}: extracted {len(jobs)} jobs so far")
                time.sleep(2)  # polite delay between pages

            except PlaywrightTimeout:
                log.error(f"[Internshala] Timeout on page {page_num} for '{keyword}'")
                continue
            except Exception as e:
                log.error(f"[Internshala] Error: {e}")
                continue

        browser.close()

    log.info(f"[Internshala] Total jobs scraped for '{keyword}': {len(jobs)}")
    return jobs


# ─────────────────────────────────────────────
# SOURCE 2: REMOTIVE (Fallback API)
# ─────────────────────────────────────────────
def scrape_remotive(keyword):
    """Remotive public API — remote tech jobs, no auth needed."""
    log.info(f"[Remotive] Searching: {keyword}")
    url = "https://remotive.com/api/remote-jobs"
    params = {"search": keyword, "limit": 10}

    try:
        response = requests.get(url, headers=HEADERS, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        log.error(f"[Remotive] Failed: {e}")
        return []

    jobs = []
    for job in data.get("jobs", []):
        jobs.append({
            "title": job.get("title", "N/A"),
            "company": job.get("company_name", "N/A"),
            "location": job.get("candidate_required_location", "Remote"),
            "salary": job.get("salary", "N/A"),
            "url": job.get("url", "N/A"),
            "tags": job.get("tags", []),
            "keyword": keyword,
            "source": "remotive",
            "scraped_at": datetime.now().isoformat()
        })

    log.info(f"[Remotive] Found {len(jobs)} jobs for '{keyword}'")
    return jobs


# ─────────────────────────────────────────────
# MAIN SCRAPER
# ─────────────────────────────────────────────
def scrape_jobs(keywords, pages=2, sources=["internshala", "remotive"]):
    """Scrape jobs from all enabled sources."""
    all_jobs = []
    seen_urls = set()

    for keyword in keywords:
        log.info(f"\n===== Keyword: {keyword} =====")

        keyword_jobs = []

        if "internshala" in sources:
            keyword_jobs += scrape_internshala_playwright(keyword, pages=pages)

        if "remotive" in sources:
            keyword_jobs += scrape_remotive(keyword)

        # Deduplicate by URL
        for job in keyword_jobs:
            if job["url"] not in seen_urls and job["url"] != "N/A":
                seen_urls.add(job["url"])
                all_jobs.append(job)

        time.sleep(1)

    log.info(f"\nTotal unique jobs found: {len(all_jobs)}")
    return all_jobs


def load_skills_from_resume(resume_json_path):
    """Load and filter searchable skills from Phase 1 resume JSON."""
    with open(resume_json_path, "r") as f:
        resume = json.load(f)

    skills = []
    skills += resume.get("skills", [])
    skills += resume.get("frameworks", [])
    skills = list(set([s.strip().lower() for s in skills if s.strip()]))

    # Filter to job-searchable keywords only
    searchable = [
        "python", "django", "react", "javascript", "node", "flask",
        "machine learning", "data science", "devops", "backend",
        "frontend", "full stack", "java", "golang"
    ]
    filtered = [k for k in searchable if k in skills]
    if not filtered:
        filtered = skills[:4]

    log.info(f"Keywords from resume: {filtered}")
    return filtered


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape jobs for ApplyBot")
    parser.add_argument("--resume-json", help="Path to parsed resume JSON from Phase 1")
    parser.add_argument("--keywords", nargs="+", help="Manual keywords e.g. --keywords python django")
    parser.add_argument("--pages", type=int, default=2, help="Pages per keyword for Internshala (default: 2)")
    parser.add_argument("--output", default="jobs.json", help="Output JSON file (default: jobs.json)")
    parser.add_argument("--sources", nargs="+", default=["internshala", "remotive"],
                        help="Sources to scrape: internshala remotive (default: both)")
    args = parser.parse_args()

    # Determine keywords
    if args.resume_json:
        if not os.path.exists(args.resume_json):
            log.error(f"File not found: {args.resume_json}")
            exit(1)
        keywords = load_skills_from_resume(args.resume_json)
    elif args.keywords:
        keywords = [k.lower() for k in args.keywords]
    else:
        keywords = ["python", "django", "react"]

    log.info(f"Sources: {args.sources}")
    log.info(f"Keywords: {keywords}")

    # Scrape
    jobs = scrape_jobs(keywords, pages=args.pages, sources=args.sources)

    # Save
    with open(args.output, "w") as f:
        json.dump(jobs, f, indent=2)

    log.info(f"Saved {len(jobs)} jobs to '{args.output}'")
    print(f"\n✅ Done! Found {len(jobs)} jobs → saved to {args.output}")

    # Preview
    if jobs:
        internshala_jobs = [j for j in jobs if j["source"] == "internshala"]
        remotive_jobs = [j for j in jobs if j["source"] == "remotive"]
        print(f"   📌 Internshala: {len(internshala_jobs)} jobs")
        print(f"   🌐 Remotive:    {len(remotive_jobs)} jobs")
        print("\n📋 Preview (first 3):")
        for job in jobs[:3]:
            print(f"  • {job['title']} @ {job['company']} [{job['source']}]")
            print(f"    {job['url']}")
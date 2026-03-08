import requests
import json
import logging
import argparse
import os
import time
from datetime import datetime

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
    "Referer": "https://internshala.com/jobs/",
    "X-Requested-With": "XMLHttpRequest",
}


def scrape_internshala_api(keyword, page=1):
    """Scrape Internshala jobs using their internal API endpoint."""
    url = f"https://internshala.com/jobs/{keyword.lower().replace(' ', '-')}-jobs/page-{page}"

    # Use the AJAX endpoint instead
    api_url = "https://internshala.com/jobs/ajax-jobs"
    params = {
        "keywords": keyword,
        "page": page,
    }

    log.info(f"Fetching: keyword='{keyword}' page={page}")

    try:
        response = requests.get(api_url, headers=HEADERS, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.JSONDecodeError:
        # Fallback: try the LinkedIn Jobs API (public, no auth needed)
        log.warning(f"Internshala API failed, trying fallback...")
        return scrape_remotive(keyword)
    except requests.exceptions.RequestException as e:
        log.error(f"Request failed: {e}")
        return []

    jobs = []
    listings = data.get("jobs", data.get("internships", []))
    for job in listings:
        jobs.append({
            "title": job.get("profile", job.get("title", "N/A")),
            "company": job.get("company_name", "N/A"),
            "location": job.get("location", "N/A"),
            "salary": job.get("salary", job.get("stipend", "N/A")),
            "url": f"https://internshala.com{job.get('relative_url', '')}",
            "keyword": keyword,
            "source": "internshala",
            "scraped_at": datetime.now().isoformat()
        })

    log.info(f"Found {len(jobs)} jobs for '{keyword}' page {page}")
    return jobs


def scrape_remotive(keyword):
    """
    Fallback: Remotive public API — real remote tech jobs, no auth needed.
    Great for Python, Django, React, JavaScript roles.
    """
    log.info(f"Using Remotive API for: {keyword}")
    url = "https://remotive.com/api/remote-jobs"
    params = {"search": keyword, "limit": 20}

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        log.error(f"Remotive API failed: {e}")
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

    log.info(f"Remotive: Found {len(jobs)} jobs for '{keyword}'")
    return jobs


def scrape_jobs_multiapi(keywords, pages=1):
    """Scrape jobs for multiple keywords, using best available source."""
    all_jobs = []
    seen_urls = set()

    for keyword in keywords:
        log.info(f"--- Searching: {keyword} ---")

        # Try Remotive first (most reliable, public API)
        jobs = scrape_remotive(keyword)

        # Deduplicate
        for job in jobs:
            if job["url"] not in seen_urls:
                seen_urls.add(job["url"])
                all_jobs.append(job)

        time.sleep(0.5)

    log.info(f"Total unique jobs found: {len(all_jobs)}")
    return all_jobs


def load_skills_from_resume(resume_json_path):
    """Load skills from Phase 1 parsed resume JSON."""
    with open(resume_json_path, "r") as f:
        resume = json.load(f)

    skills = []
    skills += resume.get("skills", [])
    skills += resume.get("frameworks", [])

    # Clean and deduplicate
    skills = list(set([s.strip().lower() for s in skills if s.strip()]))

    # Filter to job-searchable keywords only
    searchable = [
        "python", "django", "react", "javascript", "node", "flask",
        "machine learning", "data science", "devops", "backend", "frontend",
        "full stack", "android", "ios", "java", "golang", "ruby"
    ]
    filtered = [k for k in searchable if k in skills]

    # Fallback to top 4 skills if nothing matches
    if not filtered:
        filtered = skills[:4]

    log.info(f"Using keywords: {filtered}")
    return filtered


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape jobs for ApplyBot")
    parser.add_argument("--resume-json", help="Path to parsed resume JSON from Phase 1")
    parser.add_argument("--keywords", nargs="+", help="Manual keywords e.g. --keywords python django")
    parser.add_argument("--pages", type=int, default=1, help="Pages per keyword (default: 1)")
    parser.add_argument("--output", default="jobs.json", help="Output JSON file (default: jobs.json)")
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

    # Scrape
    jobs = scrape_jobs_multiapi(keywords, pages=args.pages)

    # Save
    with open(args.output, "w") as f:
        json.dump(jobs, f, indent=2)

    log.info(f"Saved {len(jobs)} jobs to '{args.output}'")
    print(f"\n✅ Done! Found {len(jobs)} jobs → saved to {args.output}")

    # Preview first 3
    if jobs:
        print("\n📋 Preview (first 3 jobs):")
        for job in jobs[:3]:
            print(f"  • {job['title']} @ {job['company']} [{job['source']}]")
            print(f"    {job['url']}")
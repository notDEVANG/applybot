import json
import logging
import argparse
import os
import time
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
log = logging.getLogger(__name__)

# Groq client
api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    log.error("Missing GROQ_API_KEY in .env file!")
    exit(1)

client = Groq(api_key=api_key)


def build_resume_summary(resume):
    """Convert resume JSON into a clean text summary for matching."""
    skills = resume.get("skills", []) + resume.get("frameworks", []) + resume.get("languages", [])
    skills_str = ", ".join(set(skills))

    experience = resume.get("experience", [])
    exp_str = ""
    for exp in experience:
        exp_str += f"{exp.get('role')} at {exp.get('company')} ({exp.get('duration')})\n"
        for r in exp.get("responsibilities", []):
            exp_str += f"  - {r}\n"

    projects = resume.get("projects", [])
    proj_str = ""
    for proj in projects:
        proj_str += f"{proj.get('name')}: {proj.get('description')} | Stack: {', '.join(proj.get('tech_stack', []))}\n"

    summary = f"""
Candidate: {resume.get('name')}
Summary: {resume.get('summary')}
Skills: {skills_str}
Experience:
{exp_str}
Projects:
{proj_str}
Education: {resume.get('education', [{}])[0].get('degree')} from {resume.get('education', [{}])[0].get('institution')}
"""
    return summary.strip()


def score_job(resume_summary, job, retries=3):
    """Use Groq AI to score a job against the resume. Returns 0-100."""

    prompt = f"""
You are a job matching expert. Score how well this candidate matches the job.

CANDIDATE PROFILE:
{resume_summary}

JOB:
Title: {job.get('title')}
Company: {job.get('company')}
Location: {job.get('location')}
Tags/Skills: {', '.join(job.get('tags', []))}

Scoring criteria:
- Skills match (40 points): How many required skills does the candidate have?
- Experience level match (30 points): Is the candidate's experience level appropriate?
- Role relevance (30 points): How relevant is the job role to candidate's background?

Return ONLY a JSON object like this, nothing else:
{{
  "score": <number 0-100>,
  "reason": "<one sentence explanation>",
  "missing_skills": ["<skill1>", "<skill2>"],
  "matching_skills": ["<skill1>", "<skill2>"]
}}
"""

    for attempt in range(retries):
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,  # low temp for consistent scoring
            )
            raw = response.choices[0].message.content.strip()

            # Clean markdown if present
            import re
            raw = re.sub(r"^```json", "", raw).strip()
            raw = re.sub(r"^```", "", raw).strip()
            raw = re.sub(r"```$", "", raw).strip()

            result = json.loads(raw)
            return result

        except json.JSONDecodeError:
            log.warning(f"JSON parse failed on attempt {attempt + 1}, retrying...")
            time.sleep(1)
        except Exception as e:
            log.error(f"Groq error: {e}")
            time.sleep(2)

    # If all retries fail, return a default
    return {"score": 0, "reason": "Could not evaluate", "missing_skills": [], "matching_skills": []}


def match_jobs(resume_path, jobs_path, threshold=40):
    """Main matching function."""

    # Load resume
    log.info(f"Loading resume from: {resume_path}")
    with open(resume_path, "r") as f:
        resume = json.load(f)
    resume_summary = build_resume_summary(resume)
    log.info("Resume summary built successfully")

    # Load jobs
    log.info(f"Loading jobs from: {jobs_path}")
    with open(jobs_path, "r") as f:
        jobs = json.load(f)
    log.info(f"Loaded {len(jobs)} jobs to evaluate")

    # Score each job
    matched = []
    for i, job in enumerate(jobs):
        log.info(f"Scoring job {i+1}/{len(jobs)}: {job.get('title')} @ {job.get('company')}")
        scoring = score_job(resume_summary, job)

        matched.append({
            **job,
            "match_score": scoring.get("score", 0),
            "match_reason": scoring.get("reason", ""),
            "matching_skills": scoring.get("matching_skills", []),
            "missing_skills": scoring.get("missing_skills", []),
        })

        time.sleep(2)  # avoid rate limiting

    # Sort by score descending
    matched.sort(key=lambda x: x["match_score"], reverse=True)

    # Filter by threshold
    above_threshold = [j for j in matched if j["match_score"] >= threshold]
    below_threshold = [j for j in matched if j["match_score"] < threshold]

    log.info(f"Jobs above {threshold}% match: {len(above_threshold)}")
    log.info(f"Jobs below {threshold}% match: {len(below_threshold)}")

    return matched, above_threshold


def print_results(matched, threshold=40):
    """Pretty print the matching results."""
    print("\n" + "="*60)
    print("📊 JOB MATCH RESULTS")
    print("="*60)

    for job in matched:
        score = job["match_score"]
        emoji = "🟢" if score >= 70 else "🟡" if score >= 40 else "🔴"

        print(f"\n{emoji} {score}/100 — {job['title']} @ {job['company']}")
        print(f"   📍 {job['location']} | 🌐 {job['source']}")
        print(f"   💬 {job['match_reason']}")
        if job["matching_skills"]:
            print(f"   ✅ Matching: {', '.join(job['matching_skills'])}")
        if job["missing_skills"]:
            print(f"   ❌ Missing:  {', '.join(job['missing_skills'])}")
        print(f"   🔗 {job['url']}")

    print("\n" + "="*60)
    above = [j for j in matched if j["match_score"] >= threshold]
    print(f"✅ {len(above)} jobs above {threshold}% match threshold")
    print(f"📁 Full results saved to matched_jobs.json")
    print("="*60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AI job matcher for ApplyBot")
    parser.add_argument("--resume-json", required=True, help="Path to parsed resume JSON (Phase 1 output)")
    parser.add_argument("--jobs-json", required=True, help="Path to scraped jobs JSON (Phase 2 output)")
    parser.add_argument("--threshold", type=int, default=40, help="Minimum match score to highlight (default: 40)")
    parser.add_argument("--output", default="matched_jobs.json", help="Output file (default: matched_jobs.json)")
    args = parser.parse_args()

    # Validate inputs
    for path in [args.resume_json, args.jobs_json]:
        if not os.path.exists(path):
            log.error(f"File not found: {path}")
            exit(1)

    # Run matching
    matched, above_threshold = match_jobs(args.resume_json, args.jobs_json, args.threshold)

    # Save full results
    with open(args.output, "w") as f:
        json.dump(matched, f, indent=2)

    # Print results
    print_results(matched, args.threshold)

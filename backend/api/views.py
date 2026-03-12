import os
import json
import threading
from datetime import datetime
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from .models import Resume, Job, PipelineRun
from .serializers import ResumeSerializer, JobSerializer, PipelineRunSerializer

# ─────────────────────────────────────────────
# RESUME UPLOAD + PARSE
# ─────────────────────────────────────────────
class ResumeUploadView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        """Upload and parse a PDF resume."""
        if "resume" not in request.FILES:
            return Response({"error": "No resume file provided"}, status=400)

        pdf_file = request.FILES["resume"]

        # Save temporarily
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            for chunk in pdf_file.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        try:
            # Parse resume using Phase 1 logic
            parsed = parse_resume_with_groq(tmp_path)

            # Save to database
            resume = Resume.objects.create(
                name=parsed.get("name", ""),
                email=parsed.get("email", ""),
                phone=parsed.get("phone", ""),
                skills=parsed.get("skills", []),
                languages=parsed.get("languages", []),
                frameworks=parsed.get("frameworks", []),
                tools=parsed.get("tools", []),
                experience=parsed.get("experience", []),
                education=parsed.get("education", []),
                projects=parsed.get("projects", []),
                summary=parsed.get("summary", ""),
            )

            return Response(ResumeSerializer(resume).data, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
        finally:
            os.unlink(tmp_path)

    def get(self, request):
        """Get the most recent resume."""
        resume = Resume.objects.last()
        if not resume:
            return Response({"error": "No resume found"}, status=404)
        return Response(ResumeSerializer(resume).data)


# ─────────────────────────────────────────────
# JOBS
# ─────────────────────────────────────────────
class JobListView(APIView):
    def get(self, request):
        """Get all jobs with optional filtering."""
        jobs = Job.objects.all()

        # Filter by score
        min_score = request.query_params.get("min_score")
        if min_score:
            jobs = jobs.filter(match_score__gte=int(min_score))

        # Filter by source
        source = request.query_params.get("source")
        if source:
            jobs = jobs.filter(source=source)

        # Filter by status
        job_status = request.query_params.get("status")
        if job_status:
            jobs = jobs.filter(status=job_status)

        return Response(JobSerializer(jobs, many=True).data)


class JobUpdateView(APIView):
    def patch(self, request, job_id):
        """Update job status (applied, skipped, etc)."""
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response({"error": "Job not found"}, status=404)

        new_status = request.data.get("status")
        if new_status not in ["pending", "applied", "interviewing", "rejected", "skipped"]:
            return Response({"error": "Invalid status"}, status=400)

        job.status = new_status
        job.save()
        return Response(JobSerializer(job).data)


# ─────────────────────────────────────────────
# STATS
# ─────────────────────────────────────────────
class StatsView(APIView):
    def get(self, request):
        """Get dashboard statistics."""
        total = Job.objects.count()
        applied = Job.objects.filter(status="applied").count()
        pending = Job.objects.filter(status="pending").count()
        strong = Job.objects.filter(match_score__gte=70).count()
        interviewing = Job.objects.filter(status="interviewing").count()
        rejected = Job.objects.filter(status="rejected").count()
        avg_score = Job.objects.filter(match_score__gt=0).values_list("match_score", flat=True)
        avg = round(sum(avg_score) / len(avg_score), 1) if avg_score else 0

        resume = Resume.objects.last()

        return Response({
            "total_jobs": total,
            "applied": applied,
            "pending": pending,
            "strong_matches": strong,
            "interviewing": interviewing,
            "rejected": rejected,
            "avg_score": avg,
            "resume": ResumeSerializer(resume).data if resume else None,
        })


# ─────────────────────────────────────────────
# PIPELINE RUN
# ─────────────────────────────────────────────
class RunPipelineView(APIView):
    def post(self, request):
        """Trigger scrape + match pipeline in background thread."""
        resume = Resume.objects.last()
        if not resume:
            return Response({"error": "Upload a resume first"}, status=400)

        # Create pipeline run record
        run = PipelineRun.objects.create(status="running")

        # Run in background so API returns immediately
        thread = threading.Thread(
            target=run_pipeline_background,
            args=(resume, run.id)
        )
        thread.daemon = True
        thread.start()

        return Response({
            "message": "Pipeline started",
            "run_id": run.id
        }, status=202)


class PipelineStatusView(APIView):
    def get(self, request, run_id):
        """Check status of a pipeline run."""
        try:
            run = PipelineRun.objects.get(id=run_id)
            return Response(PipelineRunSerializer(run).data)
        except PipelineRun.DoesNotExist:
            return Response({"error": "Run not found"}, status=404)


# ─────────────────────────────────────────────
# BACKGROUND PIPELINE LOGIC
# ─────────────────────────────────────────────
def run_pipeline_background(resume, run_id):
    """Run scrape + match pipeline in background."""
    import sys
    import os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

    try:
        run = PipelineRun.objects.get(id=run_id)

        # Get keywords from resume
        skills = resume.skills + resume.frameworks
        searchable = ["python", "django", "react", "javascript", "node",
                      "flask", "machine learning", "data science"]
        keywords = [k for k in searchable if k.lower() in [s.lower() for s in skills]]
        if not keywords:
            keywords = skills[:3]

        run.log += f"Keywords: {keywords}\n"
        run.save()

        # Phase 2: Scrape jobs
        from job_scraper import scrape_jobs
        scraped_jobs = scrape_jobs(keywords, pages=1, sources=["internshala", "remotive"])
        run.jobs_scraped = len(scraped_jobs)
        run.log += f"Scraped {len(scraped_jobs)} jobs\n"
        run.save()

        # Clear old jobs
        Job.objects.all().delete()

        # Phase 3: Match jobs
        resume_summary = build_resume_summary(resume)
        matched = 0

        for job in scraped_jobs:
            try:
                scoring = score_job_api(resume_summary, job)
                Job.objects.create(
                    title=job.get("title", ""),
                    company=job.get("company", ""),
                    location=job.get("location", ""),
                    salary=job.get("salary", ""),
                    url=job.get("url", ""),
                    source=job.get("source", ""),
                    keyword=job.get("keyword", ""),
                    tags=job.get("tags", []),
                    match_score=scoring.get("score", 0),
                    match_reason=scoring.get("reason", ""),
                    matching_skills=scoring.get("matching_skills", []),
                    missing_skills=scoring.get("missing_skills", []),
                )
                matched += 1
            except Exception as e:
                run.log += f"Error matching job: {e}\n"

        run.jobs_matched = matched
        run.status = "complete"
        run.completed_at = datetime.now()
        run.log += f"Pipeline complete. {matched} jobs matched.\n"
        run.save()

    except Exception as e:
        try:
            run = PipelineRun.objects.get(id=run_id)
            run.status = "failed"
            run.log += f"Pipeline failed: {e}\n"
            run.save()
        except:
            pass


def build_resume_summary(resume):
    """Build resume text summary for matching."""
    skills = resume.skills + resume.frameworks + resume.languages
    skills_str = ", ".join(set(skills))
    exp = resume.experience[0] if resume.experience else {}
    edu = resume.education[0] if resume.education else {}
    return f"""
Candidate: {resume.name}
Summary: {resume.summary}
Skills: {skills_str}
Experience: {exp.get('role', '')} at {exp.get('company', '')}
Education: {edu.get('degree', '')} from {edu.get('institution', '')}
""".strip()


def score_job_api(resume_summary, job):
    """Score a job using Groq API."""
    import re
    from groq import Groq
    from dotenv import load_dotenv
    load_dotenv()

    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    prompt = f"""
You are a job matching expert. Score how well this candidate matches the job.

CANDIDATE:
{resume_summary}

JOB:
Title: {job.get('title')}
Company: {job.get('company')}
Tags: {', '.join(job.get('tags', []))}

Return ONLY valid JSON, no markdown:
{{"score": <0-100>, "reason": "<one sentence>", "matching_skills": [], "missing_skills": []}}
"""
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
    )
    raw = response.choices[0].message.content.strip()
    raw = re.sub(r"^```json|^```|```$", "", raw).strip()
    return json.loads(raw)


def parse_resume_with_groq(pdf_path):
    """Parse resume PDF using Groq."""
    import pdfplumber
    import re
    from groq import Groq
    from dotenv import load_dotenv
    load_dotenv()

    # Extract text
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    prompt = f"""
Extract from this resume into JSON. Return ONLY raw JSON, no markdown:
{{
  "name": "", "email": "", "phone": "",
  "skills": [], "languages": [], "frameworks": [], "tools": [],
  "experience": [{{"role":"","company":"","duration":"","responsibilities":[]}}],
  "education": [{{"degree":"","institution":"","year":"","score":""}}],
  "projects": [{{"name":"","tech_stack":[],"description":""}}],
  "summary": ""
}}
Resume:
{text}
"""
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )
    raw = response.choices[0].message.content.strip()
    raw = re.sub(r"^```json|^```|```$", "", raw).strip()
    return json.loads(raw)

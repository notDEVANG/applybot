from django.db import models

class Resume(models.Model):
    name = models.CharField(max_length=200, blank=True)
    email = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    skills = models.JSONField(default=list)
    languages = models.JSONField(default=list)
    frameworks = models.JSONField(default=list)
    tools = models.JSONField(default=list)
    experience = models.JSONField(default=list)
    education = models.JSONField(default=list)
    projects = models.JSONField(default=list)
    summary = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.email})"


class Job(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("applied", "Applied"),
        ("interviewing", "Interviewing"),
        ("rejected", "Rejected"),
        ("skipped", "Skipped"),
    ]

    title = models.CharField(max_length=300)
    company = models.CharField(max_length=300)
    location = models.CharField(max_length=200, blank=True)
    salary = models.CharField(max_length=200, blank=True)
    url = models.URLField(max_length=500)
    source = models.CharField(max_length=50)
    keyword = models.CharField(max_length=100, blank=True)
    tags = models.JSONField(default=list)
    match_score = models.IntegerField(default=0)
    match_reason = models.TextField(blank=True)
    matching_skills = models.JSONField(default=list)
    missing_skills = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    scraped_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-match_score"]

    def __str__(self):
        return f"{self.title} @ {self.company} ({self.match_score}%)"


class PipelineRun(models.Model):
    STATUS_CHOICES = [
        ("running", "Running"),
        ("complete", "Complete"),
        ("failed", "Failed"),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="running")
    jobs_scraped = models.IntegerField(default=0)
    jobs_matched = models.IntegerField(default=0)
    jobs_applied = models.IntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    log = models.TextField(blank=True)

    def __str__(self):
        return f"Run {self.id} — {self.status}"


class AuthToken(models.Model):
    """Simple token-based auth — one token per user."""
    user = models.OneToOneField(
        "auth.User", on_delete=models.CASCADE, related_name="auth_token"
    )
    key = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.key:
            import secrets
            self.key = secrets.token_hex(32)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Token for {self.user.email}"
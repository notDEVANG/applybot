from django.urls import path
from . import views
from . import auth_views

urlpatterns = [
    # ── Auth ──────────────────────────────
    path("auth/register/", auth_views.RegisterView.as_view()),
    path("auth/login/", auth_views.LoginView.as_view()),
    path("auth/logout/", auth_views.LogoutView.as_view()),
    path("auth/me/", auth_views.MeView.as_view()),

    # ── Resume ────────────────────────────
    path("resume/", views.ResumeUploadView.as_view()),

    # ── Jobs ──────────────────────────────
    path("jobs/", views.JobListView.as_view()),
    path("jobs/<int:job_id>/", views.JobUpdateView.as_view()),

    # ── Stats ─────────────────────────────
    path("stats/", views.StatsView.as_view()),

    # ── Pipeline ──────────────────────────
    path("pipeline/run/", views.RunPipelineView.as_view()),
    path("pipeline/status/<int:run_id>/", views.PipelineStatusView.as_view()),
]
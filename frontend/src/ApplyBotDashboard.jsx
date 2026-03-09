import { useState, useEffect } from "react";

const SAMPLE_JOBS = [
  { id: 1, title: "Associate Web Developer", company: "Trivora Systems", location: "Work from home", score: 80, status: "pending", matching: ["JavaScript", "HTML", "CSS", "React.js"], missing: [], url: "#", source: "internshala" },
  { id: 2, title: "Full Stack Developer", company: "Apptroid", location: "Work from home", score: 80, status: "applied", matching: ["JavaScript", "HTML", "CSS", "Python", "React.js"], missing: [], url: "#", source: "internshala" },
  { id: 3, title: "React.JS Developer", company: "Chaintech Network", location: "Ahmedabad", score: 80, status: "pending", matching: ["JavaScript", "React.js", "HTML", "CSS"], missing: [], url: "#", source: "internshala" },
  { id: 4, title: "Senior Python Backend Developer", company: "SKYCATCHFIRE", location: "USA (Remote)", score: 74, status: "applied", matching: ["python", "django", "api", "react"], missing: ["flask", "next.js"], url: "#", source: "remotive" },
  { id: 5, title: "Full Stack Developer", company: "HEXA SOLUTIONS", location: "Work from home", score: 80, status: "skipped", matching: ["JavaScript", "HTML", "CSS", "Python", "React.js"], missing: [], url: "#", source: "internshala" },
  { id: 6, title: "Junior Data Scientist", company: "Trivora Systems", location: "Work from home", score: 70, status: "pending", matching: ["python", "pandas", "scikit-learn"], missing: ["TensorFlow"], url: "#", source: "internshala" },
  { id: 7, title: "Front End Developer", company: "Boomerang", location: "Work from home", score: 70, status: "applied", matching: ["JavaScript", "HTML", "CSS", "React.js"], missing: [], url: "#", source: "internshala" },
  { id: 8, title: "AI Associate", company: "RS Infomedia", location: "Delhi", score: 70, status: "pending", matching: ["python", "scikit-learn", "pandas"], missing: ["AI experience"], url: "#", source: "internshala" },
];

const STATS = [
  { label: "Jobs Scraped", value: "172", sub: "this run" },
  { label: "Strong Matches", value: "18", sub: "score ≥ 80" },
  { label: "Applied", value: "3", sub: "this week" },
  { label: "Match Rate", value: "85%", sub: "avg score" },
];

const PAGES = ["Dashboard", "Matches", "Applications", "Settings"];

const TIERS = [
  { name: "Free", price: "₹0", period: "forever", jobs: "5 matches/day", features: ["Resume parsing", "Job matching", "Manual apply"], accent: "#64748B", cta: "Current Plan" },
  { name: "Starter", price: "₹299", period: "/month", jobs: "25 auto-applies/day", features: ["Everything in Free", "Auto-apply bot", "AI cover letters", "Daily digest email"], accent: "#34D399", cta: "Upgrade Now", popular: true },
  { name: "Pro", price: "₹599", period: "/month", jobs: "Unlimited applies", features: ["Everything in Starter", "All job platforms", "Priority matching", "Interview prep"], accent: "#F59E0B", cta: "Go Pro" },
];

function ScoreBadge({ score }) {
  const color = score >= 70 ? "#34D399" : score >= 40 ? "#F59E0B" : "#F87171";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 44, height: 44, borderRadius: "50%",
      border: `2px solid ${color}20`,
      background: `${color}10`,
      color, fontWeight: 800, fontSize: 13,
      fontFamily: "'DM Mono', monospace",
      flexShrink: 0,
    }}>{score}</div>
  );
}

function StatusPill({ status }) {
  const map = {
    applied: { bg: "#34D39915", color: "#34D399", label: "Applied" },
    pending: { bg: "#F59E0B15", color: "#F59E0B", label: "Pending" },
    skipped: { bg: "#64748B15", color: "#64748B", label: "Skipped" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 20,
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
    }}>{s.label}</span>
  );
}

function JobCard({ job, onApply }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        border: "1px solid #1E293B",
        borderRadius: 12,
        padding: "16px 20px",
        marginBottom: 10,
        cursor: "pointer",
        background: expanded ? "#0F172A" : "transparent",
        transition: "all 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <ScoreBadge score={job.score} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#F1F5F9" }}>{job.title}</span>
            <span style={{ fontSize: 11, color: "#475569", background: "#1E293B", padding: "2px 8px", borderRadius: 4 }}>{job.source}</span>
          </div>
          <div style={{ color: "#64748B", fontSize: 13, marginTop: 2 }}>
            {job.company} · {job.location}
          </div>
        </div>
        <StatusPill status={job.status} />
      </div>

      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #1E293B" }}>
          <div style={{ display: "flex", gap: 24, marginBottom: 12, flexWrap: "wrap" }}>
            {job.matching.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "#34D399", marginBottom: 6, letterSpacing: 1 }}>✅ MATCHING</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {job.matching.map(s => (
                    <span key={s} style={{ padding: "2px 8px", borderRadius: 4, background: "#34D39910", color: "#34D399", fontSize: 11 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {job.missing.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "#F87171", marginBottom: 6, letterSpacing: 1 }}>❌ MISSING</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {job.missing.map(s => (
                    <span key={s} style={{ padding: "2px 8px", borderRadius: 4, background: "#F8717110", color: "#F87171", fontSize: 11 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          {job.status === "pending" && (
            <button
              onClick={(e) => { e.stopPropagation(); onApply(job.id); }}
              style={{
                padding: "8px 20px", borderRadius: 8,
                background: "#34D399", color: "#0A0A0F",
                border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: 13,
                fontFamily: "inherit",
              }}
            >Apply Now →</button>
          )}
        </div>
      )}
    </div>
  );
}

function DashboardPage({ jobs, onApply }) {
  const applied = jobs.filter(j => j.status === "applied").length;
  const pending = jobs.filter(j => j.status === "pending").length;

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 28 }}>
        {STATS.map(s => (
          <div key={s.label} style={{ border: "1px solid #1E293B", borderRadius: 12, padding: "16px 18px", background: "#0D1117" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#F1F5F9", fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ border: "1px solid #1E293B", borderRadius: 12, padding: 20, marginBottom: 24, background: "#0D1117" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: "#94A3B8" }}>Today's Apply Progress</span>
          <span style={{ fontSize: 13, color: "#34D399", fontFamily: "'DM Mono', monospace" }}>{applied}/{applied + pending} jobs</span>
        </div>
        <div style={{ height: 6, background: "#1E293B", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 3,
            background: "linear-gradient(90deg, #34D399, #059669)",
            width: `${(applied / (applied + pending)) * 100}%`,
            transition: "width 0.5s ease",
          }} />
        </div>
      </div>

      {/* Top matches */}
      <div style={{ color: "#64748B", fontSize: 11, letterSpacing: 2, marginBottom: 14 }}>TOP MATCHES TODAY</div>
      {jobs.slice(0, 5).map(job => <JobCard key={job.id} job={job} onApply={onApply} />)}
    </div>
  );
}

function MatchesPage({ jobs, onApply, filter, setFilter }) {
  const filtered = filter === "all" ? jobs : jobs.filter(j => {
    if (filter === "strong") return j.score >= 70;
    if (filter === "medium") return j.score >= 40 && j.score < 70;
    if (filter === "wfh") return j.location.toLowerCase().includes("work from home") || j.location.toLowerCase().includes("remote");
    return true;
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["all", "strong", "medium", "wfh"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 16px", borderRadius: 20,
            border: `1px solid ${filter === f ? "#34D399" : "#1E293B"}`,
            background: filter === f ? "#34D39915" : "transparent",
            color: filter === f ? "#34D399" : "#64748B",
            cursor: "pointer", fontSize: 12, fontFamily: "inherit",
            textTransform: "capitalize",
          }}>{f === "wfh" ? "Work From Home" : f}</button>
        ))}
        <span style={{ marginLeft: "auto", color: "#475569", fontSize: 12, alignSelf: "center" }}>{filtered.length} jobs</span>
      </div>
      {filtered.map(job => <JobCard key={job.id} job={job} onApply={onApply} />)}
    </div>
  );
}

function ApplicationsPage({ jobs }) {
  const applied = jobs.filter(j => j.status === "applied");
  return (
    <div>
      <div style={{ color: "#64748B", fontSize: 11, letterSpacing: 2, marginBottom: 16 }}>
        {applied.length} APPLICATIONS SENT
      </div>
      {applied.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#334155" }}>
          No applications yet. Go to Matches and start applying!
        </div>
      ) : (
        applied.map(job => (
          <div key={job.id} style={{
            border: "1px solid #1E293B", borderRadius: 12,
            padding: "16px 20px", marginBottom: 10,
            background: "#0D1117",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <ScoreBadge score={job.score} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#F1F5F9" }}>{job.title}</div>
                <div style={{ color: "#64748B", fontSize: 13 }}>{job.company} · {job.location}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <StatusPill status={job.status} />
                <div style={{ fontSize: 11, color: "#334155", marginTop: 4 }}>Applied today</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function SettingsPage() {
  const [plan, setPlan] = useState("free");
  return (
    <div>
      <div style={{ color: "#64748B", fontSize: 11, letterSpacing: 2, marginBottom: 20 }}>SUBSCRIPTION PLANS</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        {TIERS.map(tier => (
          <div key={tier.name} style={{
            border: `1px solid ${tier.popular ? tier.accent + "50" : "#1E293B"}`,
            borderRadius: 14, padding: 22,
            background: tier.popular ? `${tier.accent}05` : "#0D1117",
            position: "relative",
          }}>
            {tier.popular && (
              <div style={{
                position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                background: tier.accent, color: "#0A0A0F",
                fontSize: 10, fontWeight: 800, padding: "3px 12px",
                borderRadius: 20, letterSpacing: 1,
              }}>MOST POPULAR</div>
            )}
            <div style={{ color: tier.accent, fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{tier.name}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#F1F5F9", marginBottom: 2 }}>
              {tier.price}<span style={{ fontSize: 14, color: "#64748B", fontWeight: 400 }}>{tier.period}</span>
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginBottom: 16 }}>{tier.jobs}</div>
            {tier.features.map(f => (
              <div key={f} style={{ fontSize: 12, color: "#94A3B8", marginBottom: 8 }}>
                <span style={{ color: tier.accent }}>✓ </span>{f}
              </div>
            ))}
            <button
              onClick={() => setPlan(tier.name.toLowerCase())}
              style={{
                width: "100%", marginTop: 16,
                padding: "10px 0", borderRadius: 8,
                background: plan === tier.name.toLowerCase() ? `${tier.accent}20` : tier.accent,
                color: plan === tier.name.toLowerCase() ? tier.accent : "#0A0A0F",
                border: `1px solid ${tier.accent}`,
                cursor: "pointer", fontWeight: 700,
                fontSize: 13, fontFamily: "inherit",
                transition: "all 0.2s",
              }}
            >{plan === tier.name.toLowerCase() ? "✓ Active" : tier.cta}</button>
          </div>
        ))}
      </div>

      <div style={{ border: "1px solid #1E293B", borderRadius: 12, padding: 20, background: "#0D1117" }}>
        <div style={{ color: "#64748B", fontSize: 11, letterSpacing: 2, marginBottom: 16 }}>ACCOUNT SETTINGS</div>
        <div style={{ display: "grid", gap: 12 }}>
          {[
            { label: "Internshala Email", placeholder: "your@email.com" },
            { label: "Min Match Score", placeholder: "60" },
            { label: "Max Daily Applications", placeholder: "25" },
          ].map(field => (
            <div key={field.label}>
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 6 }}>{field.label}</div>
              <input
                placeholder={field.placeholder}
                style={{
                  width: "100%", padding: "10px 14px",
                  background: "#0A0A0F", border: "1px solid #1E293B",
                  borderRadius: 8, color: "#F1F5F9",
                  fontSize: 13, fontFamily: "inherit",
                  boxSizing: "border-box", outline: "none",
                }}
              />
            </div>
          ))}
          <button style={{
            padding: "10px 24px", borderRadius: 8,
            background: "#34D399", color: "#0A0A0F",
            border: "none", cursor: "pointer",
            fontWeight: 700, fontSize: 13,
            fontFamily: "inherit", width: "fit-content",
            marginTop: 4,
          }}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}

export default function ApplyBotDashboard() {
  const [page, setPage] = useState("Dashboard");
  const [jobs, setJobs] = useState(SAMPLE_JOBS);
  const [filter, setFilter] = useState("all");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  const handleApply = (id) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: "applied" } : j));
  };

  return (
    <div style={{
      fontFamily: "'DM Mono', 'Courier New', monospace",
      background: "#0A0A0F",
      minHeight: "100vh",
      color: "#E2E8F0",
      opacity: loaded ? 1 : 0,
      transition: "opacity 0.4s ease",
    }}>
      {/* Sidebar */}
      <div style={{
        position: "fixed", left: 0, top: 0, bottom: 0,
        width: 220, borderRight: "1px solid #1E293B",
        background: "#0A0A0F", padding: "28px 16px",
        display: "flex", flexDirection: "column",
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #34D399, #059669)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16,
            }}>⚡</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#F1F5F9", letterSpacing: -0.5 }}>ApplyBot</div>
              <div style={{ fontSize: 10, color: "#34D399", letterSpacing: 1 }}>INDIA</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {PAGES.map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              width: "100%", textAlign: "left",
              padding: "10px 14px", borderRadius: 8, marginBottom: 4,
              background: page === p ? "#34D39915" : "transparent",
              border: `1px solid ${page === p ? "#34D39930" : "transparent"}`,
              color: page === p ? "#34D399" : "#64748B",
              cursor: "pointer", fontSize: 13,
              fontFamily: "inherit", fontWeight: page === p ? 700 : 400,
              transition: "all 0.15s",
            }}>
              {page === p ? "▸ " : "  "}{p}
            </button>
          ))}
        </nav>

        {/* User */}
        <div style={{
          border: "1px solid #1E293B", borderRadius: 10,
          padding: "12px 14px", background: "#0D1117",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>Devang Pujare</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Free Plan</div>
          <div style={{
            marginTop: 8, fontSize: 11, color: "#34D399",
            cursor: "pointer",
          }}>Upgrade to Starter →</div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 220, padding: "32px 32px 32px 32px", maxWidth: 900 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 8px #34D399" }} />
            <span style={{ fontSize: 11, color: "#34D399", letterSpacing: 2 }}>PIPELINE ACTIVE</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#F1F5F9" }}>{page}</h1>
          <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 13 }}>
            {page === "Dashboard" && "Your job hunt at a glance"}
            {page === "Matches" && "AI-scored job matches from Internshala & Remotive"}
            {page === "Applications" && "Track every application you've sent"}
            {page === "Settings" && "Configure your account and subscription"}
          </p>
        </div>

        {/* Page content */}
        {page === "Dashboard" && <DashboardPage jobs={jobs} onApply={handleApply} />}
        {page === "Matches" && <MatchesPage jobs={jobs} onApply={handleApply} filter={filter} setFilter={setFilter} />}
        {page === "Applications" && <ApplicationsPage jobs={jobs} />}
        {page === "Settings" && <SettingsPage />}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "./api";

// ─── HOOKS ──────────────────────────────────────────────
function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return count;
}

// ─── COMPONENTS ─────────────────────────────────────────
function AnimatedStat({ value, label, sub, accent }) {
  const num = useCountUp(value || 0);
  return (
    <div style={{
      background: "white", borderRadius: 16, padding: "20px 24px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
      border: "1px solid #F1F5F9", transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
    >
      <div style={{ fontSize: 28, fontWeight: 800, color: accent, letterSpacing: -1, fontFamily: "monospace" }}>{num}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#1E293B", marginTop: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function ScoreRing({ score }) {
  const color = score >= 70 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444";
  const r = 18, cx = 22, cy = 22;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
      <svg width="44" height="44" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth="3" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 800, color, fontFamily: "monospace",
      }}>{score}</div>
    </div>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const colors = { success: "#10B981", error: "#EF4444", info: "#6366F1" };
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: "white", borderRadius: 12, padding: "14px 20px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      border: `1px solid ${colors[type]}30`,
      borderLeft: `4px solid ${colors[type]}`,
      display: "flex", alignItems: "center", gap: 10,
      animation: "slideIn 0.3s ease",
      maxWidth: 320,
    }}>
      <span style={{ fontSize: 16 }}>{type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"}</span>
      <span style={{ fontSize: 13, color: "#1E293B", fontWeight: 500 }}>{message}</span>
    </div>
  );
}

function ResumeUploadModal({ onClose, onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const inputRef = useRef();

  const handleFile = async (f) => {
    if (!f || !f.name.endsWith(".pdf")) return;
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const resume = await api.uploadResume(file);
      onUploaded(resume);
      onClose();
    } catch (e) {
      alert("Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.5)", display: "flex",
      alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(4px)",
    }} onClick={onClose}>
      <div style={{
        background: "white", borderRadius: 20, padding: 32,
        width: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#0F172A" }}>Upload Resume</h2>
        <p style={{ margin: "0 0 24px", color: "#64748B", fontSize: 14 }}>PDF format only. We'll parse it automatically.</p>

        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => inputRef.current.click()}
          style={{
            border: `2px dashed ${dragging ? "#6366F1" : file ? "#10B981" : "#E2E8F0"}`,
            borderRadius: 14, padding: "40px 20px", textAlign: "center",
            cursor: "pointer", marginBottom: 20,
            background: dragging ? "#EEF2FF" : file ? "#F0FDF4" : "#F8FAFC",
            transition: "all 0.2s",
          }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{file ? "✅" : "📄"}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1E293B" }}>
            {file ? file.name : "Drop your PDF here or click to browse"}
          </div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
            {file ? `${(file.size / 1024).toFixed(0)} KB` : "PDF files only"}
          </div>
          <input ref={inputRef} type="file" accept=".pdf" style={{ display: "none" }}
            onChange={e => handleFile(e.target.files[0])} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "11px 0", borderRadius: 10,
            border: "1px solid #E2E8F0", background: "transparent",
            color: "#64748B", cursor: "pointer", fontWeight: 600, fontFamily: "inherit",
          }}>Cancel</button>
          <button onClick={handleUpload} disabled={!file || uploading} style={{
            flex: 2, padding: "11px 0", borderRadius: 10,
            background: file ? "linear-gradient(135deg, #6366F1, #8B5CF6)" : "#F1F5F9",
            color: file ? "white" : "#94A3B8",
            border: "none", cursor: file ? "pointer" : "not-allowed",
            fontWeight: 700, fontFamily: "inherit", fontSize: 14,
            boxShadow: file ? "0 2px 8px rgba(99,102,241,0.3)" : "none",
          }}>
            {uploading ? "⟳ Parsing..." : "⚡ Upload & Parse"}
          </button>
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, onStatusChange, dark }) {
  const [expanded, setExpanded] = useState(false);
  const statusStyles = {
    pending: { bg: "#EEF2FF", color: "#6366F1", label: "To Apply" },
    applied: { bg: "#EFF6FF", color: "#3B82F6", label: "Applied" },
    interviewing: { bg: "#FFFBEB", color: "#F59E0B", label: "Interview" },
    rejected: { bg: "#FEF2F2", color: "#EF4444", label: "Rejected" },
    skipped: { bg: "#F8FAFC", color: "#94A3B8", label: "Skipped" },
  };
  const s = statusStyles[job.status] || statusStyles.pending;

  return (
    <div style={{
      background: dark ? "#1E293B" : "white",
      border: `1px solid ${dark ? "#334155" : "#F1F5F9"}`,
      borderRadius: 14, marginBottom: 10, overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "all 0.2s",
    }}>
      <div onClick={() => setExpanded(!expanded)}
        style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
        <ScoreRing score={job.match_score} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: dark ? "#F1F5F9" : "#0F172A" }}>{job.title}</span>
            <span style={{
              fontSize: 10, padding: "2px 7px", borderRadius: 4, fontWeight: 600,
              background: job.source === "internshala" ? "#EEF2FF" : "#F0FDF4",
              color: job.source === "internshala" ? "#6366F1" : "#16A34A",
            }}>{job.source}</span>
          </div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>
            {job.company} · 📍 {job.location}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
          <span style={{ color: "#94A3B8", fontSize: 12, display: "inline-block", transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 18px 16px", borderTop: `1px solid ${dark ? "#334155" : "#F8FAFC"}`, paddingTop: 14 }}>
          {job.match_reason && (
            <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 12px", fontStyle: "italic" }}>"{job.match_reason}"</p>
          )}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 14 }}>
            {job.matching_skills?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "#10B981", fontWeight: 600, marginBottom: 6 }}>✓ MATCHING</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {job.matching_skills.map(s => (
                    <span key={s} style={{ padding: "3px 9px", borderRadius: 6, background: "#F0FDF4", color: "#16A34A", fontSize: 11 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {job.missing_skills?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "#EF4444", fontWeight: 600, marginBottom: 6 }}>✗ MISSING</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {job.missing_skills.map(s => (
                    <span key={s} style={{ padding: "3px 9px", borderRadius: 6, background: "#FEF2F2", color: "#DC2626", fontSize: 11 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {job.status === "pending" && (
              <button onClick={() => onStatusChange(job.id, "applied")} style={{
                padding: "8px 18px", borderRadius: 8,
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                color: "white", border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: 13, fontFamily: "inherit",
              }}>⚡ Mark Applied</button>
            )}
            {job.status === "applied" && (
              <button onClick={() => onStatusChange(job.id, "interviewing")} style={{
                padding: "8px 18px", borderRadius: 8,
                background: "#FFFBEB", color: "#F59E0B",
                border: "1px solid #FDE68A", cursor: "pointer",
                fontWeight: 600, fontSize: 13, fontFamily: "inherit",
              }}>🎯 Got Interview</button>
            )}
            <a href={job.url} target="_blank" rel="noreferrer" style={{
              padding: "8px 18px", borderRadius: 8,
              background: "transparent", color: "#6366F1",
              border: "1px solid #E0E7FF", cursor: "pointer",
              fontWeight: 600, fontSize: 13, textDecoration: "none",
              display: "inline-block",
            }}>View Job →</a>
            {job.status !== "rejected" && (
              <button onClick={() => onStatusChange(job.id, "rejected")} style={{
                padding: "8px 12px", borderRadius: 8,
                background: "transparent", color: "#EF4444",
                border: "1px solid #FEE2E2", cursor: "pointer",
                fontSize: 13, fontFamily: "inherit",
              }}>✕</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────
const NAV = [
  { id: "Dashboard", icon: "⊡" },
  { id: "Matches", icon: "⚡" },
  { id: "Applications", icon: "📋" },
  { id: "Settings", icon: "⚙" },
];

export default function ApplyBotDashboard({ user, onLogout }) {
  const [page, setPage] = useState("Dashboard");
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [resume, setResume] = useState(null);
  const [dark, setDark] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  // Load initial data
  useEffect(() => {
    Promise.all([
      api.getStats().catch(() => null),
      api.getJobs().catch(() => []),
      api.getResume().catch(() => null),
    ]).then(([statsData, jobsData, resumeData]) => {
      setStats(statsData);
      setJobs(jobsData);
      setResume(resumeData);
      setLoading(false);
      setLoaded(true);
    });
  }, []);

  // Poll pipeline status
  useEffect(() => {
    if (!runId) return;
    pollRef.current = setInterval(async () => {
      try {
        const status = await api.getPipelineStatus(runId);
        if (status.status === "complete") {
          clearInterval(pollRef.current);
          setRunning(false);
          setRunId(null);
          // Reload jobs and stats
          const [newJobs, newStats] = await Promise.all([api.getJobs(), api.getStats()]);
          setJobs(newJobs);
          setStats(newStats);
          showToast(`Pipeline complete! ${status.jobs_matched} jobs matched.`);
        } else if (status.status === "failed") {
          clearInterval(pollRef.current);
          setRunning(false);
          setRunId(null);
          showToast("Pipeline failed. Check console.", "error");
        }
      } catch (e) {}
    }, 2000);
    return () => clearInterval(pollRef.current);
  }, [runId]);

  const handleRunPipeline = async () => {
    if (!resume) { setShowUpload(true); return; }
    setRunning(true);
    showToast("Pipeline started! Scraping jobs...", "info");
    try {
      const result = await api.runPipeline();
      setRunId(result.run_id);
    } catch (e) {
      setRunning(false);
      showToast("Failed to start pipeline: " + e.message, "error");
    }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      const updated = await api.updateJobStatus(jobId, newStatus);
      setJobs(prev => prev.map(j => j.id === jobId ? updated : j));
      showToast(`Marked as ${newStatus}!`);
    } catch (e) {
      showToast("Failed to update status", "error");
    }
  };

  const filteredJobs = jobs.filter(j => {
    if (filter === "strong") return j.match_score >= 70;
    if (filter === "remote") return j.location?.toLowerCase().includes("remote") || j.location?.toLowerCase().includes("work from home");
    if (filter === "internshala") return j.source === "internshala";
    if (filter === "pending") return j.status === "pending";
    return true;
  });

  const bg = dark ? "#0F172A" : "#F8FAFC";
  const sidebar = dark ? "#1E293B" : "white";
  const border = dark ? "#334155" : "#F1F5F9";
  const text = dark ? "#F1F5F9" : "#0F172A";
  const sub = dark ? "#64748B" : "#94A3B8";

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      background: bg, minHeight: "100vh", color: text,
      opacity: loaded ? 1 : 0, transition: "opacity 0.3s ease",
      display: "flex",
    }}>
      {/* Sidebar */}
      <div style={{
        width: 240, flexShrink: 0,
        background: sidebar, borderRight: `1px solid ${border}`,
        display: "flex", flexDirection: "column", padding: "24px 12px",
        position: "sticky", top: 0, height: "100vh", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, paddingLeft: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>⚡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: text, letterSpacing: -0.5 }}>ApplyBot</div>
            <div style={{ fontSize: 10, color: "#6366F1", fontWeight: 600, letterSpacing: 1 }}>INDIA</div>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 10, marginBottom: 4,
              background: page === n.id ? "#EEF2FF" : "transparent",
              border: "none", cursor: "pointer",
              color: page === n.id ? "#6366F1" : sub,
              fontWeight: page === n.id ? 700 : 400,
              fontSize: 14, fontFamily: "inherit", transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>{n.id}
            </button>
          ))}
        </nav>

        <div style={{ border: `1px solid ${border}`, borderRadius: 12, padding: "12px 14px", background: dark ? "#0F172A" : "#F8FAFC" }}>
          {resume ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: text }}>{resume.name || "Resume Uploaded"}</div>
              <div style={{ fontSize: 11, color: sub, marginTop: 2 }}>{resume.email}</div>
              <div style={{ fontSize: 11, color: "#10B981", marginTop: 6 }}>✓ Resume parsed</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 12, color: sub, marginBottom: 8 }}>No resume uploaded</div>
              <button onClick={() => setShowUpload(true)} style={{
                width: "100%", padding: "8px 0", borderRadius: 8,
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                color: "white", border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: 12, fontFamily: "inherit",
              }}>Upload Resume</button>
            </>
          )}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Topbar */}
        <div style={{
          position: "sticky", top: 0, zIndex: 50,
          background: sidebar, borderBottom: `1px solid ${border}`,
          padding: "14px 28px", display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: text }}>{page}</div>
            <div style={{ fontSize: 12, color: sub }}>
              {loading ? "Loading..." : `${jobs.length} jobs in database`}
            </div>
          </div>
          <button onClick={handleRunPipeline} disabled={running} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 18px", borderRadius: 10,
            background: running ? "#F0FDF4" : "linear-gradient(135deg, #6366F1, #8B5CF6)",
            color: running ? "#16A34A" : "white",
            border: running ? "1px solid #BBF7D0" : "none",
            cursor: running ? "not-allowed" : "pointer",
            fontWeight: 700, fontSize: 13, fontFamily: "inherit",
            boxShadow: running ? "none" : "0 2px 8px rgba(99,102,241,0.3)",
          }}>
            <span style={{ display: "inline-block", animation: running ? "spin 1s linear infinite" : "none" }}>
              {running ? "⟳" : "⚡"}
            </span>
            {running ? "Running..." : "Run Pipeline"}
          </button>
          <button onClick={() => setShowUpload(true)} style={{
            padding: "9px 16px", borderRadius: 10,
            border: `1px solid ${border}`, background: "transparent",
            color: sub, cursor: "pointer", fontSize: 13, fontFamily: "inherit",
          }}>📄 Upload Resume</button>
          <button onClick={() => setDark(!dark)} style={{
            width: 36, height: 36, borderRadius: 10,
            border: `1px solid ${border}`, background: "transparent",
            cursor: "pointer", fontSize: 16, color: sub,
          }}>{dark ? "☀" : "☾"}</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg, #6EE7B7, #3B82F6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#080810", fontWeight: 900, fontSize: 13,
            }}>{(user?.name || "U")[0].toUpperCase()}</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: sub, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name || "User"}</span>
          </div>
          <button onClick={onLogout} style={{
            padding: "8px 14px", borderRadius: 8,
            border: `1px solid ${border}`, background: "transparent",
            color: sub, cursor: "pointer", fontSize: 12, fontFamily: "inherit",
          }}>Log out</button>
        </div>

        {/* Content */}
        <div style={{ padding: "28px", maxWidth: 900 }}>

          {/* DASHBOARD PAGE */}
          {page === "Dashboard" && (
            <div>
              <div style={{
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A78BFA 100%)",
                borderRadius: 20, padding: "28px 32px", marginBottom: 24, color: "white",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", right: -20, top: -20, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
                <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Good morning 👋</div>
                <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, letterSpacing: -0.5 }}>
                  {user?.name || resume?.name || "Welcome to ApplyBot"}
                </div>
                <div style={{ fontSize: 14, opacity: 0.85 }}>
                  {jobs.length > 0
                    ? `${jobs.filter(j => j.match_score >= 70).length} strong matches waiting · ${jobs.filter(j => j.status === "pending").length} to apply`
                    : "Upload your resume and run the pipeline to get started"}
                </div>
                {!resume && (
                  <button onClick={() => setShowUpload(true)} style={{
                    marginTop: 16, padding: "10px 22px", borderRadius: 10,
                    background: "rgba(255,255,255,0.2)", color: "white",
                    border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer",
                    fontWeight: 600, fontSize: 13, fontFamily: "inherit",
                  }}>📄 Upload Resume to Start</button>
                )}
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
                <AnimatedStat value={stats?.total_jobs || 0} label="Jobs Scraped" sub="in database" accent="#6366F1" />
                <AnimatedStat value={stats?.strong_matches || 0} label="Strong Matches" sub="score ≥ 70" accent="#10B981" />
                <AnimatedStat value={stats?.applied || 0} label="Applied" sub="total" accent="#3B82F6" />
                <AnimatedStat value={stats?.interviewing || 0} label="Interviews" sub="in progress" accent="#F59E0B" />
              </div>

              {/* Top matches */}
              {jobs.length > 0 ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 14 }}>Top Matches</div>
                  {jobs.filter(j => j.match_score >= 70).slice(0, 5).map(job =>
                    <JobCard key={job.id} job={job} onStatusChange={handleStatusChange} dark={dark} />
                  )}
                </>
              ) : (
                <div style={{
                  textAlign: "center", padding: "60px 20px",
                  border: `2px dashed ${border}`, borderRadius: 16,
                  color: sub,
                }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: text, marginBottom: 8 }}>No jobs yet</div>
                  <div style={{ fontSize: 13, marginBottom: 20 }}>Upload your resume and click "Run Pipeline" to scrape and match jobs</div>
                  <button onClick={handleRunPipeline} style={{
                    padding: "10px 24px", borderRadius: 10,
                    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                    color: "white", border: "none", cursor: "pointer",
                    fontWeight: 700, fontFamily: "inherit",
                  }}>⚡ Run Pipeline Now</button>
                </div>
              )}
            </div>
          )}

          {/* MATCHES PAGE */}
          {page === "Matches" && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 4, background: dark ? "#1E293B" : "#F1F5F9", borderRadius: 10, padding: 4 }}>
                  {["all", "strong", "remote", "internshala", "pending"].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                      padding: "6px 14px", borderRadius: 7,
                      background: filter === f ? (dark ? "#0F172A" : "white") : "transparent",
                      color: filter === f ? "#6366F1" : "#64748B",
                      border: "none", cursor: "pointer",
                      fontSize: 12, fontWeight: filter === f ? 700 : 400,
                      fontFamily: "inherit", textTransform: "capitalize",
                      boxShadow: filter === f ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    }}>{f}</button>
                  ))}
                </div>
                <span style={{ marginLeft: "auto", fontSize: 12, color: sub }}>{filteredJobs.length} jobs</span>
              </div>
              {filteredJobs.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: sub }}>No jobs match this filter</div>
              ) : (
                filteredJobs.map(job => <JobCard key={job.id} job={job} onStatusChange={handleStatusChange} dark={dark} />)
              )}
            </div>
          )}

          {/* APPLICATIONS PAGE */}
          {page === "Applications" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {[
                  { id: "applied", label: "Applied", color: "#3B82F6", emoji: "✉️" },
                  { id: "interviewing", label: "Interview", color: "#F59E0B", emoji: "🎯" },
                  { id: "rejected", label: "Rejected", color: "#EF4444", emoji: "✗" },
                ].map(col => {
                  const colJobs = jobs.filter(j => j.status === col.id);
                  return (
                    <div key={col.id} style={{
                      background: dark ? "#1E293B" : "#F8FAFC",
                      borderRadius: 14, padding: 14,
                      border: `1px solid ${border}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span>{col.emoji}</span>
                        <span style={{ fontWeight: 700, fontSize: 13, color: text }}>{col.label}</span>
                        <span style={{
                          marginLeft: "auto", minWidth: 22, height: 22,
                          borderRadius: "50%", background: col.color, color: "white",
                          fontSize: 11, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>{colJobs.length}</span>
                      </div>
                      {colJobs.map(job => (
                        <div key={job.id} style={{
                          background: dark ? "#0F172A" : "white",
                          borderRadius: 10, padding: 12, marginBottom: 8,
                          border: `1px solid ${border}`,
                        }}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: text, marginBottom: 3 }}>{job.title}</div>
                          <div style={{ fontSize: 11, color: sub, marginBottom: 8 }}>{job.company}</div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <ScoreRing score={job.match_score} />
                            <a href={job.url} target="_blank" rel="noreferrer" style={{
                              fontSize: 11, color: "#6366F1", textDecoration: "none", fontWeight: 600,
                            }}>View →</a>
                          </div>
                        </div>
                      ))}
                      {colJobs.length === 0 && (
                        <div style={{ textAlign: "center", padding: "20px 0", color: "#CBD5E1", fontSize: 12 }}>Empty</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SETTINGS PAGE */}
          {page === "Settings" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
                {[
                  { name: "Free", price: "₹0", color: "#64748B", features: ["5 matches/day", "Manual apply"] },
                  { name: "Starter", price: "₹299/mo", color: "#6366F1", features: ["25 auto-applies/day", "AI cover letters", "Daily digest"], popular: true },
                  { name: "Pro", price: "₹599/mo", color: "#F59E0B", features: ["Unlimited applies", "All platforms", "Interview prep"] },
                ].map(t => (
                  <div key={t.name} style={{
                    background: dark ? "#1E293B" : "white",
                    border: `2px solid ${t.popular ? t.color : border}`,
                    borderRadius: 18, padding: 24, position: "relative",
                    boxShadow: t.popular ? `0 4px 20px ${t.color}30` : "none",
                  }}>
                    {t.popular && (
                      <div style={{
                        position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                        background: t.color, color: "white", fontSize: 10,
                        fontWeight: 800, padding: "4px 14px", borderRadius: 20, whiteSpace: "nowrap",
                      }}>⚡ MOST POPULAR</div>
                    )}
                    <div style={{ fontWeight: 800, fontSize: 18, color: t.color }}>{t.name}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: text, margin: "4px 0 16px" }}>{t.price}</div>
                    {t.features.map(f => (
                      <div key={f} style={{ fontSize: 13, color: sub, marginBottom: 8 }}>
                        <span style={{ color: t.color }}>✓ </span>{f}
                      </div>
                    ))}
                    <button style={{
                      width: "100%", marginTop: 16, padding: "11px 0", borderRadius: 10,
                      background: t.popular ? t.color : "transparent",
                      color: t.popular ? "white" : t.color,
                      border: `1px solid ${t.color}`,
                      cursor: "pointer", fontWeight: 700, fontFamily: "inherit",
                    }}>
                      {t.name === "Free" ? "Current Plan" : "Pay with Razorpay"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals & Toasts */}
      {showUpload && (
        <ResumeUploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={(r) => { setResume(r); showToast("Resume uploaded and parsed!"); }}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 2px; }
      `}</style>
    </div>
  );
}
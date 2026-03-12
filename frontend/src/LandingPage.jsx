import { useState, useEffect } from "react";

const FEATURES = [
  {
    icon: "⚡",
    title: "Auto Job Scraping",
    desc: "Automatically scrapes Internshala, Naukri, Remotive and more every day based on your skills. No manual searching ever again.",
    tag: "LIVE",
  },
  {
    icon: "🧠",
    title: "AI Match Scoring",
    desc: "Every job gets scored 0–100 by our AI engine. It reads your resume deeply and only surfaces jobs you actually qualify for.",
    tag: "AI",
  },
  {
    icon: "🤖",
    title: "Auto-Apply Bot",
    desc: "Our Playwright bot logs into Internshala and applies on your behalf with AI-generated cover letters tailored to each role.",
    tag: "BOT",
  },
  {
    icon: "📊",
    title: "Application Tracker",
    desc: "Kanban-style board tracks every application — pending, applied, interview, rejected. Never lose track of where you stand.",
    tag: "TRACK",
  },
];

const STEPS = [
  { num: "01", title: "Upload Your Resume", desc: "Drop your PDF. Our AI parses your skills, experience and projects in seconds." },
  { num: "02", title: "We Scrape Jobs", desc: "ApplyBot scans Indian job boards and remote platforms matching your exact skill set." },
  { num: "03", title: "AI Scores Every Job", desc: "Each job gets a match score. You see only the best — no noise, no irrelevant listings." },
  { num: "04", title: "Bot Applies For You", desc: "One click and ApplyBot fills forms, writes cover letters and submits applications." },
];

const PLANS = [
  { name: "Free", price: "₹0", period: "", features: ["5 job matches/day", "Resume parsing", "Manual apply only", "Basic tracker"], cta: "Get Started Free", highlight: false },
  { name: "Starter", price: "₹299", period: "/mo", features: ["25 auto-applies/day", "AI cover letters", "Daily email digest", "Internshala + Remotive", "Priority matching"], cta: "Start Applying", highlight: true },
  { name: "Pro", price: "₹599", period: "/mo", features: ["Unlimited applies", "All job platforms", "Interview prep AI", "Hiring manager emails", "WhatsApp alerts"], cta: "Go Pro", highlight: false },
];

function AnimatedCounter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 20);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString()}{suffix}</span>;
}

export default function LandingPage({ onLogin, onRegister }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredPlan, setHoveredPlan] = useState(null);

  return (
    <div style={{ background: "#080810", minHeight: "100vh", color: "#E2E8F0", fontFamily: "'Cabinet Grotesk', 'Syne', 'DM Sans', sans-serif", overflowX: "hidden" }}>

      {/* ── NOISE TEXTURE OVERLAY ── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.4,
      }} />

      {/* ── HEADER ── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(8,8,16,0.85)",
        backdropFilter: "blur(20px)",
        padding: "0 5vw",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", height: 64, gap: 40 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: "linear-gradient(135deg, #6EE7B7, #3B82F6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17, fontWeight: 900, boxShadow: "0 0 20px rgba(110,231,183,0.3)",
            }}>⚡</div>
            <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.5, color: "white" }}>
              Apply<span style={{ color: "#6EE7B7" }}>Bot</span>
            </span>
            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: "rgba(110,231,183,0.1)", color: "#6EE7B7", fontWeight: 700, letterSpacing: 1 }}>INDIA</span>
          </div>

          {/* Nav links */}
          <nav style={{ flex: 1, display: "flex", gap: 32, justifyContent: "center" }}>
            {["Features", "How It Works", "Pricing"].map(link => (
              <a key={link} href={`#${link.toLowerCase().replace(/ /g, "-")}`} style={{
                color: "#94A3B8", fontSize: 14, fontWeight: 500, textDecoration: "none",
                transition: "color 0.2s",
              }}
                onMouseEnter={e => e.target.style.color = "white"}
                onMouseLeave={e => e.target.style.color = "#94A3B8"}
              >{link}</a>
            ))}
          </nav>

          {/* Auth buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onLogin} style={{
              padding: "8px 20px", borderRadius: 8,
              background: "transparent", color: "#94A3B8",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "inherit",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            >Log in</button>
            <button onClick={onRegister} style={{
              padding: "8px 20px", borderRadius: 8,
              background: "linear-gradient(135deg, #6EE7B7, #3B82F6)",
              color: "#080810", border: "none",
              cursor: "pointer", fontWeight: 800, fontSize: 14, fontFamily: "inherit",
              boxShadow: "0 0 20px rgba(110,231,183,0.25)",
              transition: "opacity 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >Get Started →</button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ paddingTop: 160, paddingBottom: 100, textAlign: "center", padding: "160px 5vw 100px", position: "relative" }}>
        {/* Glow blobs */}
        <div style={{ position: "absolute", top: 80, left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(110,231,183,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 200, left: "20%", width: 300, height: 300, background: "radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 14px", borderRadius: 20,
            border: "1px solid rgba(110,231,183,0.2)",
            background: "rgba(110,231,183,0.05)",
            fontSize: 12, color: "#6EE7B7", fontWeight: 600,
            letterSpacing: 0.5, marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6EE7B7", display: "inline-block", boxShadow: "0 0 8px #6EE7B7", animation: "pulse 2s infinite" }} />
            AI-Powered Job Applications for Indian Freshers
          </div>

          <h1 style={{
            fontSize: "clamp(36px, 6vw, 72px)",
            fontWeight: 900, lineHeight: 1.08,
            letterSpacing: -2, margin: "0 0 24px",
            color: "white",
          }}>
            Stop Applying.<br />
            <span style={{ background: "linear-gradient(135deg, #6EE7B7, #3B82F6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Let the Bot Do It.
            </span>
          </h1>

          <p style={{ fontSize: 18, color: "#64748B", lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: "0 auto 40px" }}>
            ApplyBot scrapes Internshala, scores jobs with AI, and auto-applies on your behalf. Get more interviews while you sleep.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={onRegister} style={{
              padding: "14px 32px", borderRadius: 10,
              background: "linear-gradient(135deg, #6EE7B7, #3B82F6)",
              color: "#080810", border: "none",
              cursor: "pointer", fontWeight: 800, fontSize: 16, fontFamily: "inherit",
              boxShadow: "0 0 40px rgba(110,231,183,0.3)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 40px rgba(110,231,183,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(110,231,183,0.3)"; }}
            >Start Applying Free →</button>
            <button onClick={onLogin} style={{
              padding: "14px 32px", borderRadius: 10,
              background: "transparent", color: "#94A3B8",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer", fontWeight: 600, fontSize: 16, fontFamily: "inherit",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            >Log in to Dashboard</button>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 40, justifyContent: "center", marginTop: 60, flexWrap: "wrap" }}>
            {[
              { val: 172, suffix: "+", label: "Jobs scraped per run" },
              { val: 85, suffix: "%", label: "Avg match accuracy" },
              { val: 25, suffix: "x", label: "Faster than manual" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: "white", letterSpacing: -1, fontFamily: "monospace" }}>
                  <AnimatedCounter target={s.val} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "80px 5vw", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 12, color: "#6EE7B7", fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>FEATURES</div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: -1, color: "white", margin: 0 }}>
            Everything you need to<br />land your first job
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 18, padding: 28,
              transition: "all 0.3s",
              cursor: "default",
              position: "relative", overflow: "hidden",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(110,231,183,0.04)";
                e.currentTarget.style.borderColor = "rgba(110,231,183,0.2)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ position: "absolute", top: 20, right: 20, fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "rgba(110,231,183,0.1)", color: "#6EE7B7", fontWeight: 700, letterSpacing: 1 }}>{f.tag}</div>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "white", margin: "0 0 10px", letterSpacing: -0.3 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: "80px 5vw" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ fontSize: 12, color: "#6EE7B7", fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>HOW IT WORKS</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: -1, color: "white", margin: 0 }}>
              From resume to interview<br />in 4 steps
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 0, position: "relative" }}>
            {/* connector line */}
            <div style={{ position: "absolute", top: 28, left: "12.5%", right: "12.5%", height: 1, background: "linear-gradient(90deg, transparent, rgba(110,231,183,0.3), transparent)", pointerEvents: "none" }} />
            {STEPS.map((step, i) => (
              <div key={step.num} style={{ textAlign: "center", padding: "0 16px" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  border: "1px solid rgba(110,231,183,0.3)",
                  background: "rgba(110,231,183,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px",
                  fontFamily: "monospace", fontSize: 13, fontWeight: 800, color: "#6EE7B7",
                }}>{step.num}</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: "0 0 8px", letterSpacing: -0.2 }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "80px 5vw" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ fontSize: 12, color: "#6EE7B7", fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>PRICING</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: -1, color: "white", margin: "0 0 12px" }}>
              Simple, affordable plans
            </h2>
            <p style={{ color: "#475569", fontSize: 15, margin: 0 }}>Built for Indian freshers. No dollar billing, no hidden fees.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {PLANS.map(plan => (
              <div key={plan.name}
                onMouseEnter={() => setHoveredPlan(plan.name)}
                onMouseLeave={() => setHoveredPlan(null)}
                style={{
                  borderRadius: 20, padding: 28, position: "relative",
                  background: plan.highlight ? "linear-gradient(160deg, rgba(110,231,183,0.08), rgba(59,130,246,0.08))" : "rgba(255,255,255,0.02)",
                  border: plan.highlight ? "1px solid rgba(110,231,183,0.25)" : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: plan.highlight ? "0 0 40px rgba(110,231,183,0.08)" : "none",
                  transform: hoveredPlan === plan.name ? "translateY(-4px)" : "translateY(0)",
                  transition: "transform 0.3s",
                }}>
                {plan.highlight && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    background: "linear-gradient(135deg, #6EE7B7, #3B82F6)",
                    color: "#080810", fontSize: 10, fontWeight: 900,
                    padding: "4px 14px", borderRadius: 20, whiteSpace: "nowrap", letterSpacing: 1,
                  }}>⚡ MOST POPULAR</div>
                )}
                <div style={{ fontSize: 15, fontWeight: 800, color: "#94A3B8", marginBottom: 8 }}>{plan.name}</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: "white", letterSpacing: -2, marginBottom: 4 }}>
                  {plan.price}<span style={{ fontSize: 14, fontWeight: 400, color: "#475569" }}>{plan.period}</span>
                </div>
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "20px 0" }} />
                {plan.features.map(f => (
                  <div key={f} style={{ fontSize: 13, color: "#64748B", marginBottom: 10, display: "flex", gap: 8 }}>
                    <span style={{ color: "#6EE7B7", flexShrink: 0 }}>✓</span>{f}
                  </div>
                ))}
                <button onClick={onRegister} style={{
                  width: "100%", marginTop: 20, padding: "12px 0", borderRadius: 10,
                  background: plan.highlight ? "linear-gradient(135deg, #6EE7B7, #3B82F6)" : "transparent",
                  color: plan.highlight ? "#080810" : "#6EE7B7",
                  border: plan.highlight ? "none" : "1px solid rgba(110,231,183,0.3)",
                  cursor: "pointer", fontWeight: 800, fontSize: 14, fontFamily: "inherit",
                  transition: "opacity 0.2s",
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >{plan.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: "80px 5vw" }}>
        <div style={{
          maxWidth: 800, margin: "0 auto", textAlign: "center",
          background: "linear-gradient(160deg, rgba(110,231,183,0.07), rgba(59,130,246,0.07))",
          border: "1px solid rgba(110,231,183,0.15)",
          borderRadius: 24, padding: "60px 40px",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(110,231,183,0.1), transparent 60%)", pointerEvents: "none" }} />
          <h2 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 900, letterSpacing: -1, color: "white", margin: "0 0 16px" }}>
            Ready to land your first job?
          </h2>
          <p style={{ color: "#475569", fontSize: 16, margin: "0 0 32px" }}>Join freshers already using ApplyBot to get more interviews with less effort.</p>
          <button onClick={onRegister} style={{
            padding: "14px 36px", borderRadius: 10,
            background: "linear-gradient(135deg, #6EE7B7, #3B82F6)",
            color: "#080810", border: "none",
            cursor: "pointer", fontWeight: 900, fontSize: 16, fontFamily: "inherit",
            boxShadow: "0 0 40px rgba(110,231,183,0.3)",
          }}>Create Free Account →</button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "40px 5vw",
        color: "#334155",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: "linear-gradient(135deg, #6EE7B7, #3B82F6)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            }}>⚡</div>
            <span style={{ fontWeight: 800, color: "#475569" }}>ApplyBot India</span>
          </div>
          <div style={{ fontSize: 13 }}>Built by Devang Pujare · Ratnagiri, Maharashtra</div>
          <div style={{ fontSize: 13 }}>© 2026 ApplyBot India. All rights reserved.</div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

import { useState } from "react";
import { api } from "./api";


export default function AuthPage({ mode, onLogin, onSwitch, onBack }) {
  const isLogin = mode === "login";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!form.email || !form.password) { setError("Please fill in all fields."); return; }
    if (!isLogin && !form.name) { setError("Please enter your name."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      let user;
      if (isLogin) {
        user = await api.login(form.email, form.password);
      } else {
        user = await api.register(form.name, form.email, form.password);
      }
      onLogin(user);
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    // Redirect to Django Google OAuth endpoint
    window.location.href = "http://localhost:8000/auth/google/";
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#080810",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Syne', 'DM Sans', sans-serif", padding: "20px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background glow */}
      <div style={{ position: "fixed", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(110,231,183,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "20%", right: "20%", width: 300, height: 300, background: "radial-gradient(ellipse, rgba(59,130,246,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Back button */}
      <button onClick={onBack} style={{
        position: "fixed", top: 24, left: 24,
        background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
        color: "#64748B", padding: "8px 16px", borderRadius: 8,
        cursor: "pointer", fontSize: 13, fontFamily: "inherit",
        display: "flex", alignItems: "center", gap: 6,
        transition: "all 0.2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "#64748B"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
      >← Back</button>

      {/* Logo */}
      <div style={{ position: "fixed", top: 22, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #6EE7B7, #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
        <span style={{ fontWeight: 900, fontSize: 16, color: "white" }}>Apply<span style={{ color: "#6EE7B7" }}>Bot</span></span>
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 420,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 24, padding: "40px 36px",
        backdropFilter: "blur(20px)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        position: "relative",
      }}>
        {/* Top accent line */}
        <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: "linear-gradient(90deg, transparent, rgba(110,231,183,0.4), transparent)", borderRadius: 1 }} />

        <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", letterSpacing: -0.5, marginBottom: 6 }}>
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p style={{ fontSize: 14, color: "#475569", marginBottom: 28 }}>
          {isLogin ? "Log in to your ApplyBot dashboard." : "Start applying to jobs automatically."}
        </p>

        {/* Google OAuth */}
        <button onClick={handleGoogle} style={{
          width: "100%", padding: "12px 0", borderRadius: 10,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "white", cursor: "pointer",
          fontWeight: 600, fontSize: 14, fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          marginBottom: 20, transition: "all 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
        >
          {/* Google SVG icon */}
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          <span style={{ fontSize: 12, color: "#334155" }}>or continue with email</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
        </div>

        {/* Fields */}
        {!isLogin && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Full Name</label>
            <input
              type="text" placeholder="Devang Pujare"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "white", fontSize: 14, fontFamily: "inherit", outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(110,231,183,0.4)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Email Address</label>
          <input
            type="email" placeholder="you@example.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "white", fontSize: 14, fontFamily: "inherit", outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = "rgba(110,231,183,0.4)"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"} placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{
                width: "100%", padding: "12px 44px 12px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "white", fontSize: 14, fontFamily: "inherit", outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(110,231,183,0.4)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
            <button onClick={() => setShowPass(!showPass)} style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "transparent", border: "none", cursor: "pointer",
              color: "#475569", fontSize: 14,
            }}>{showPass ? "🙈" : "👁"}</button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: 8,
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#FCA5A5", fontSize: 13, marginBottom: 16,
          }}>{error}</div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading} style={{
          width: "100%", padding: "13px 0", borderRadius: 10,
          background: loading ? "rgba(110,231,183,0.3)" : "linear-gradient(135deg, #6EE7B7, #3B82F6)",
          color: "#080810", border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: 900, fontSize: 15, fontFamily: "inherit",
          boxShadow: loading ? "none" : "0 0 30px rgba(110,231,183,0.25)",
          transition: "all 0.2s", marginBottom: 20,
        }}>
          {loading ? "⟳ Please wait..." : isLogin ? "Log In →" : "Create Account →"}
        </button>

        {/* Switch mode */}
        <p style={{ textAlign: "center", fontSize: 13, color: "#475569", margin: 0 }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => onSwitch(isLogin ? "register" : "login")} style={{
            background: "transparent", border: "none", color: "#6EE7B7",
            cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit",
          }}>{isLogin ? "Sign up free" : "Log in"}</button>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #334155; }
      `}</style>
    </div>
  );
}
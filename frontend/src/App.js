import { useState, useEffect } from "react";
import LandingPage from "./LandingPage";
import AuthPage from "./AuthPage";
import ApplyBotDashboard from "./ApplyBotDashboard";
import { api, token } from "./api";

export default function App() {
  const [page, setPage] = useState("landing");
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  // On app load — check if user already has a saved token
  useEffect(() => {
    const savedToken = token.get();
    if (savedToken) {
      api.getMe()
        .then(userData => {
          setUser(userData);
          setPage("dashboard");
        })
        .catch(() => {
          token.clear();
        })
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setPage("dashboard");
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setPage("landing");
  };

  if (checking) {
    return (
      <div style={{
        minHeight: "100vh", background: "#080810",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "linear-gradient(135deg, #6EE7B7, #3B82F6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, margin: "0 auto 16px",
            animation: "pulse 1.5s infinite",
          }}>⚡</div>
          <div style={{ color: "#334155", fontSize: 13 }}>Loading...</div>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    );
  }

  if (page === "dashboard" && user) {
    return <ApplyBotDashboard user={user} onLogout={handleLogout} />;
  }

  if (page === "login" || page === "register") {
    return (
      <AuthPage
        mode={page}
        onLogin={handleLogin}
        onSwitch={(m) => setPage(m)}
        onBack={() => setPage("landing")}
      />
    );
  }

  return (
    <LandingPage
      onLogin={() => setPage("login")}
      onRegister={() => setPage("register")}
    />
  );
}
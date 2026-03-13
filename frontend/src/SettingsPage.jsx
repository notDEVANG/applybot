import { useState, useEffect } from "react";
import { api } from "./api";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    period: "",
    color: "#64748B",
    features: [
      "5 job matches/day",
      "Resume parsing",
      "Manual apply only",
      "Basic tracker",
    ],
    cta: "Current Plan",
  },
  {
    id: "starter",
    name: "Starter",
    price: "₹299",
    period: "/mo",
    color: "#6EE7B7",
    popular: true,
    features: [
      "25 auto-applies/day",
      "AI-generated cover letters",
      "Daily email digest",
      "Internshala + Remotive",
      "Priority matching",
    ],
    cta: "Upgrade to Starter",
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹599",
    period: "/mo",
    color: "#3B82F6",
    features: [
      "Unlimited auto-applies",
      "All job platforms",
      "Interview prep AI",
      "Hiring manager emails",
      "WhatsApp alerts",
    ],
    cta: "Upgrade to Pro",
  },
];

export default function SettingsPage({ dark, user, onPlanChange }) {
  const [subscription, setSubscription] = useState({ plan: "free", daily_limit: 5 });
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null); // which plan is being paid
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api.getSubscription()
      .then(setSubscription)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleUpgrade = async (plan) => {
    if (plan.id === "free" || plan.id === subscription.plan) return;

    setPaying(plan.id);
    try {
      // Step 1 — create order on Django backend
      const order = await api.createOrder(plan.id);

      // Step 2 — open Razorpay checkout popup
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "ApplyBot India",
        description: order.plan_name,
        order_id: order.order_id,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: { color: "#6EE7B7" },
        handler: async (response) => {
          // Step 3 — verify payment on Django backend
          try {
            const result = await api.verifyPayment({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              plan: plan.id,
            });
            setSubscription({ plan: result.plan, daily_limit: result.daily_limit });
            onPlanChange?.(result.plan);
            showToast(`🎉 Successfully upgraded to ${plan.name}!`);
          } catch (e) {
            showToast("Payment verification failed. Contact support.", "error");
          }
        },
        modal: {
          ondismiss: () => setPaying(null),
        },
      };

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        showToast("Payment failed. Please try again.", "error");
        setPaying(null);
      });
      rzp.open();

    } catch (e) {
      showToast(e.message || "Failed to initiate payment.", "error");
      setPaying(null);
    }
  };

  const card = dark ? "#1E293B" : "white";
  const border = dark ? "#334155" : "#F1F5F9";
  const text = dark ? "#F1F5F9" : "#0F172A";
  const sub = dark ? "#64748B" : "#94A3B8";

  return (
    <div>
      {/* Current plan banner */}
      {!loading && (
        <div style={{
          background: subscription.plan === "free"
            ? (dark ? "rgba(255,255,255,0.02)" : "#F8FAFC")
            : "linear-gradient(135deg, rgba(110,231,183,0.08), rgba(59,130,246,0.08))",
          border: `1px solid ${subscription.plan === "free" ? border : "rgba(110,231,183,0.2)"}`,
          borderRadius: 14, padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 14,
          marginBottom: 24,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: subscription.plan === "free"
              ? (dark ? "#334155" : "#F1F5F9")
              : "linear-gradient(135deg, #6EE7B7, #3B82F6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>
            {subscription.plan === "free" ? "🆓" : subscription.plan === "starter" ? "⚡" : "🚀"}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: text }}>
              You're on the <span style={{ color: subscription.plan === "free" ? sub : "#6EE7B7" }}>
                {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
              </span> plan
            </div>
            <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>
              {subscription.daily_limit} auto-applies per day
            </div>
          </div>
          {subscription.plan !== "free" && (
            <div style={{
              marginLeft: "auto", padding: "4px 12px", borderRadius: 20,
              background: "rgba(110,231,183,0.1)", color: "#6EE7B7",
              fontSize: 11, fontWeight: 700,
            }}>ACTIVE</div>
          )}
        </div>
      )}

      {/* Pricing cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 32 }}>
        {PLANS.map(plan => {
          const isCurrentPlan = subscription.plan === plan.id;
          const isPaying = paying === plan.id;

          return (
            <div key={plan.id} style={{
              background: card,
              border: `2px solid ${isCurrentPlan ? plan.color : border}`,
              borderRadius: 20, padding: 24,
              position: "relative",
              boxShadow: isCurrentPlan ? `0 4px 20px ${plan.color}20` : "none",
              transition: "transform 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              {plan.popular && (
                <div style={{
                  position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                  background: `linear-gradient(135deg, #6EE7B7, #3B82F6)`,
                  color: "#080810", fontSize: 10, fontWeight: 900,
                  padding: "4px 14px", borderRadius: 20, whiteSpace: "nowrap",
                }}>⚡ MOST POPULAR</div>
              )}

              {isCurrentPlan && (
                <div style={{
                  position: "absolute", top: 16, right: 16,
                  background: `${plan.color}20`, color: plan.color,
                  fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                }}>CURRENT</div>
              )}

              <div style={{ fontSize: 15, fontWeight: 800, color: plan.color, marginBottom: 6 }}>{plan.name}</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: text, letterSpacing: -1, marginBottom: 4 }}>
                {plan.price}
                <span style={{ fontSize: 14, fontWeight: 400, color: sub }}>{plan.period}</span>
              </div>

              <div style={{ height: 1, background: border, margin: "16px 0" }} />

              {plan.features.map(f => (
                <div key={f} style={{ fontSize: 13, color: sub, marginBottom: 10, display: "flex", gap: 8 }}>
                  <span style={{ color: plan.color, flexShrink: 0 }}>✓</span>{f}
                </div>
              ))}

              <button
                onClick={() => handleUpgrade(plan)}
                disabled={isCurrentPlan || isPaying}
                style={{
                  width: "100%", marginTop: 20, padding: "12px 0", borderRadius: 10,
                  background: isCurrentPlan
                    ? (dark ? "#334155" : "#F1F5F9")
                    : `linear-gradient(135deg, ${plan.color}, ${plan.id === "pro" ? "#6EE7B7" : "#3B82F6"})`,
                  color: isCurrentPlan ? sub : (plan.id === "free" ? sub : "#080810"),
                  border: isCurrentPlan ? `1px solid ${border}` : "none",
                  cursor: isCurrentPlan ? "default" : "pointer",
                  fontWeight: 800, fontSize: 14, fontFamily: "inherit",
                  opacity: isPaying ? 0.7 : 1,
                  transition: "opacity 0.2s",
                  boxShadow: isCurrentPlan ? "none" : `0 4px 14px ${plan.color}30`,
                }}>
                {isPaying ? "⟳ Opening..." : isCurrentPlan ? "✓ Current Plan" : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Account config */}
      <div style={{
        background: card, border: `1px solid ${border}`,
        borderRadius: 16, padding: 24,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 18 }}>Account Configuration</div>
        {[
          { label: "Internshala Email", placeholder: "your@email.com", type: "email" },
          { label: "Min Match Score Threshold", placeholder: "60", type: "number" },
          { label: "Max Daily Applications", placeholder: subscription.daily_limit.toString(), type: "number" },
        ].map(field => (
          <div key={field.label} style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: sub, display: "block", marginBottom: 6 }}>{field.label}</label>
            <input type={field.type} placeholder={field.placeholder} style={{
              width: "100%", padding: "10px 14px", borderRadius: 10,
              background: dark ? "#0F172A" : "#F8FAFC",
              border: `1px solid ${border}`,
              color: text, fontSize: 13, fontFamily: "inherit",
              outline: "none", boxSizing: "border-box",
            }} />
          </div>
        ))}
        <button style={{
          padding: "11px 28px", borderRadius: 10,
          background: "linear-gradient(135deg, #6EE7B7, #3B82F6)",
          color: "#080810", border: "none", cursor: "pointer",
          fontWeight: 700, fontSize: 13, fontFamily: "inherit",
        }}>Save Settings</button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: dark ? "#1E293B" : "white",
          border: `1px solid ${toast.type === "error" ? "#EF444430" : "#6EE7B730"}`,
          borderLeft: `4px solid ${toast.type === "error" ? "#EF4444" : "#6EE7B7"}`,
          borderRadius: 12, padding: "14px 20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          fontSize: 13, color: text, fontWeight: 500,
          maxWidth: 320,
        }}>{toast.msg}</div>
      )}
    </div>
  );
}

// Load Razorpay checkout script dynamically
function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

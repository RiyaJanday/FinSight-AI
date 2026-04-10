import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import { logout } from "../store/authSlice.js";
import api from "../services/api.js";

const navItems = [
  { label: "Dashboard",    icon: "⊞", path: "/dashboard"    },
  { label: "Accounts",     icon: "🏦", path: "/accounts"     },
  { label: "Transactions", icon: "💱", path: "/transactions" },
  { label: "Budgets",      icon: "🎯", path: "/budget"       },
  { label: "Goals",        icon: "◎", path: "/goals"        },
  { label: "Reports",      icon: "📋", path: "/reports"      },
  { label: "Settings",     icon: "⚙", path: "/settings"     },
];

const fmt = (n) => "₹" + Math.abs(Number(n) || 0).toLocaleString("en-IN");

const insightStyles = {
  warning: { bg: "#fff7ed", border: "#fed7aa", iconColor: "#f97316", icon: "⚠" },
  success: { bg: "#f0fdf4", border: "#bbf7d0", iconColor: "#16a34a", icon: "✓" },
  info:    { bg: "#eff6ff", border: "#bfdbfe", iconColor: "#2563eb", icon: "✦" },
  tip:     { bg: "#faf5ff", border: "#e9d5ff", iconColor: "#9333ea", icon: "💡" },
};

function Sidebar({ onNavigate, user, onLogout }) {
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";
  return (
    <div style={{ width: 260, background: "#fff", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 700 }}>₹</div>
          <span style={{ fontSize: "17px", fontWeight: 700, color: "#1e293b" }}>FinanceManager</span>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {navItems.map(({ label, icon, path }) => (
          <div key={label} onClick={() => onNavigate(path)}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, marginBottom: 4, cursor: "pointer", fontSize: "14px", color: "#64748b", background: "transparent" }}>
            <span style={{ fontSize: 16 }}>{icon}</span>{label}
          </div>
        ))}
      </nav>
      <div style={{ padding: "16px 20px", borderTop: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#3b82f6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{initials}</div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", margin: 0 }}>{user?.name}</p>
            <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#ef4444", fontSize: "13px", cursor: "pointer" }}>
          <span>→</span> Logout
        </button>
      </div>
    </div>
  );
}

export default function AIInsights() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [insights,        setInsights]        = useState([]);
  const [forecast,        setForecast]        = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [insightsLoaded,  setInsightsLoaded]  = useState(false);
  const [forecastLoaded,  setForecastLoaded]  = useState(false);

  const handleLogout = async () => {
    try { await api.post("/auth/logout", { refreshToken: localStorage.getItem("refreshToken") }); } catch {}
    dispatch(logout());
    navigate("/login");
  };

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await api.get("/ai/insights");
      setInsights(res.data.insights || []);
      setInsightsLoaded(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate insights");
    } finally {
      setLoadingInsights(false);
    }
  };

  const fetchForecast = async () => {
    setLoadingForecast(true);
    try {
      const res = await api.get("/ai/forecast");
      setForecast(res.data);
      setForecastLoaded(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate forecast");
    } finally {
      setLoadingForecast(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", background: "#f8fafc" }}>

      <Sidebar onNavigate={(path) => navigate(path)} user={user} onLogout={handleLogout} />

      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* Top bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 32px", position: "sticky", top: 0, zIndex: 10 }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>AI Insights</h1>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Powered by Claude AI — personalized financial analysis</p>
        </div>

        <div style={{ padding: "28px 32px" }}>

          {/* ── AI Insights Section ── */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
                  ✦ Spending Insights
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                  AI analysis of your spending patterns and financial health
                </p>
              </div>
              <button onClick={fetchInsights} disabled={loadingInsights}
                style={{ padding: "10px 20px", background: loadingInsights ? "#94a3b8" : "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: 10, fontSize: "14px", fontWeight: 700, cursor: loadingInsights ? "not-allowed" : "pointer" }}>
                {loadingInsights ? "Analyzing..." : insightsLoaded ? "Refresh" : "Generate Insights"}
              </button>
            </div>

            {!insightsLoaded && !loadingInsights && (
              <div style={{ textAlign: "center", padding: "40px", background: "#f8fafc", borderRadius: 12 }}>
                <p style={{ fontSize: "40px", margin: "0 0 12px" }}>✦</p>
                <p style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", margin: "0 0 6px" }}>Ready to analyze your finances</p>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Click "Generate Insights" to get personalized AI recommendations</p>
              </div>
            )}

            {loadingInsights && (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ fontSize: "32px", marginBottom: 12, animation: "spin 1s linear infinite", display: "inline-block" }}>✦</div>
                <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>Claude AI is analyzing your financial data...</p>
              </div>
            )}

            {insightsLoaded && insights.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
                {insights.map((ins, i) => {
                  const style = insightStyles[ins.type] || insightStyles.info;
                  return (
                    <div key={i} style={{ background: style.bg, border: `1px solid ${style.border}`, borderRadius: 12, padding: "16px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ color: style.iconColor, fontSize: 18 }}>{style.icon}</span>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: style.iconColor }}>{ins.title}</p>
                        <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: style.iconColor + "20", color: style.iconColor }}>
                          {ins.priority}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: 1.6 }}>{ins.description}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Forecast Section ── */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
                  📈 Next Month Forecast
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                  Predicted spending based on your transaction history
                </p>
              </div>
              <button onClick={fetchForecast} disabled={loadingForecast}
                style={{ padding: "10px 20px", background: loadingForecast ? "#94a3b8" : "linear-gradient(135deg,#22c55e,#15803d)", color: "#fff", border: "none", borderRadius: 10, fontSize: "14px", fontWeight: 700, cursor: loadingForecast ? "not-allowed" : "pointer" }}>
                {loadingForecast ? "Forecasting..." : forecastLoaded ? "Refresh" : "Generate Forecast"}
              </button>
            </div>

            {!forecastLoaded && !loadingForecast && (
              <div style={{ textAlign: "center", padding: "40px", background: "#f8fafc", borderRadius: 12 }}>
                <p style={{ fontSize: "40px", margin: "0 0 12px" }}>📈</p>
                <p style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", margin: "0 0 6px" }}>Predict your next month</p>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Add at least 5 transactions to enable forecasting</p>
              </div>
            )}

            {loadingForecast && (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>Generating forecast from your spending patterns...</p>
              </div>
            )}

            {forecastLoaded && forecast && (
              <>
                {/* Summary */}
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
                  <p style={{ margin: 0, fontSize: "14px", color: "#15803d", fontWeight: 500 }}>
                    📊 {forecast.summary}
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                    Predicted total: {fmt(forecast.totalPredicted)}
                  </p>
                </div>

                {/* Forecast chart */}
                {forecast.forecast?.length > 0 && (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={forecast.forecast} barCategoryGap="40%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v) => fmt(v)} />
                        <Bar dataKey="predicted" fill="#3b82f6" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Forecast rows */}
                    <div style={{ marginTop: 16 }}>
                      {forecast.forecast.map((f, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: "18px" }}>
                              {f.trend === "up" ? "↑" : f.trend === "down" ? "↓" : "→"}
                            </span>
                            <span style={{ fontSize: "14px", color: "#0f172a", fontWeight: 500 }}>{f.category}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: f.trend === "up" ? "#fee2e2" : f.trend === "down" ? "#dcfce7" : "#f1f5f9", color: f.trend === "up" ? "#ef4444" : f.trend === "down" ? "#16a34a" : "#64748b" }}>
                              {f.trend}
                            </span>
                            <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{fmt(f.predicted)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
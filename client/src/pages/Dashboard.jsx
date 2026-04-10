import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
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

const CATEGORY_COLORS = [
  "#3b82f6","#22c55e","#a855f7",
  "#f59e0b","#ef4444","#6b7280",
  "#14b8a6","#f97316",
];

const fmt = (n) => "₹" + Math.abs(Number(n) || 0).toLocaleString("en-IN");

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
      <p style={{ margin: 0, fontWeight: 600, color: "#1e293b" }}>{payload[0].name}</p>
      <p style={{ margin: 0, color: "#64748b" }}>{fmt(payload[0].value)}</p>
    </div>
  );
};

// ── Sidebar ───────────────────────────────────────────────────
function Sidebar({ activePage, onNavigate, user, onLogout }) {
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
      <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
        {navItems.map(({ label, icon, path }) => {
          const active = activePage === label;
          return (
            <div key={label} onClick={() => onNavigate(path)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, marginBottom: 4, cursor: "pointer", fontSize: "14px", fontWeight: active ? 600 : 400, color: active ? "#2563eb" : "#64748b", background: active ? "#eff6ff" : "transparent" }}>
              <span style={{ fontSize: 16 }}>{icon}</span>{label}
            </div>
          );
        })}
      </nav>
      <div style={{ padding: "16px 20px", borderTop: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#3b82f6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name || "User"}</p>
            <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email || ""}</p>
          </div>
        </div>
        <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#ef4444", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
          <span>→</span> Logout
        </button>
      </div>
    </div>
  );
}

// ── Skeleton Loader ───────────────────────────────────────────
function Skeleton({ w = "100%", h = 20, r = 8 }) {
  return (
    <div style={{ width: w, height: h, borderRadius: r, background: "#f1f5f9", animation: "pulse 1.5s infinite" }} />
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/transactions/dashboard-stats");
        setStats(res.data);
      } catch (err) {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      await api.post("/auth/logout", { refreshToken });
    } catch {}
    dispatch(logout());
    navigate("/login");
  };

  // Build donut data with colors
  const donutData = (stats?.spendingByCategory || []).map((d, i) => ({
    ...d,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  // AI insights — generated from real data
  const insights = [];
  if (stats) {
    if (stats.monthlyExpenses > stats.monthlyIncome) {
      insights.push({
        bg: "#fff7ed", border: "#fed7aa", iconColor: "#f97316", icon: "⚠",
        title: "Expenses Exceed Income",
        desc: `You spent ₹${(stats.monthlyExpenses - stats.monthlyIncome).toLocaleString("en-IN")} more than you earned this month.`,
      });
    }
    if (parseFloat(stats.savingsRate) >= 20) {
      insights.push({
        bg: "#f0fdf4", border: "#bbf7d0", iconColor: "#16a34a", icon: "↗",
        title: "Great Savings Rate!",
        desc: `You saved ${stats.savingsRate}% of your income this month. Keep it up!`,
      });
    }
    if (donutData.length > 0) {
      const top = donutData.reduce((a, b) => a.value > b.value ? a : b);
      insights.push({
        bg: "#eff6ff", border: "#bfdbfe", iconColor: "#2563eb", icon: "✦",
        title: "AI Recommendation",
        desc: `Your highest spend is ${top.name} at ${fmt(top.value)}. Consider setting a budget for this category.`,
      });
    }
    if (insights.length === 0) {
      insights.push({
        bg: "#eff6ff", border: "#bfdbfe", iconColor: "#2563eb", icon: "✦",
        title: "Getting Started",
        desc: "Add your first transaction to start seeing AI-powered insights about your spending.",
      });
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", background: "#f8fafc" }}>

      <Sidebar
        activePage="Dashboard"
        onNavigate={(path) => navigate(path)}
        user={user}
        onLogout={handleLogout}
      />

      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* Top bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Dashboard</h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Welcome back, {user?.name?.split(" ")[0] || ""}! Here's your financial overview.</p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ position: "relative", cursor: "pointer" }}>
              <span style={{ fontSize: 20 }}>🔔</span>
              <span style={{ position: "absolute", top: -4, right: -4, width: 10, height: 10, borderRadius: "50%", background: "#ef4444", border: "2px solid #fff" }} />
            </div>
            <span style={{ fontSize: 20, cursor: "pointer" }}>👤</span>
          </div>
        </div>

        <div style={{ padding: "28px 32px" }}>

          {/* ── Stat Cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>

            {/* Total Balance */}
            <div style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", borderRadius: 16, padding: "24px 24px 20px", color: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💳</div>
                <span style={{ fontSize: 18, opacity: 0.9 }}>↗</span>
              </div>
              <p style={{ margin: "0 0 4px", fontSize: "13px", opacity: 0.85 }}>Total Balance</p>
              <p style={{ margin: 0, fontSize: "26px", fontWeight: 700, letterSpacing: "-0.5px" }}>
                {loading ? "Loading..." : fmt(stats?.totalBalance || 0)}
              </p>
            </div>

            {/* Monthly Income */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px 24px 20px" }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>↙</div>
              </div>
              <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#64748b" }}>Monthly Income</p>
              <p style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#0f172a" }}>
                {loading ? <Skeleton h={32} /> : fmt(stats?.monthlyIncome || 0)}
              </p>
            </div>

            {/* Monthly Expenses */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px 24px 20px" }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>↗</div>
              </div>
              <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#64748b" }}>Monthly Expenses</p>
              <p style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#0f172a" }}>
                {loading ? <Skeleton h={32} /> : fmt(stats?.monthlyExpenses || 0)}
              </p>
            </div>

            {/* Savings Rate */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px 24px 20px" }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>↗</div>
              </div>
              <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#64748b" }}>Savings Rate</p>
              <p style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#0f172a" }}>
                {loading ? <Skeleton h={32} /> : `${stats?.savingsRate || 0}%`}
              </p>
            </div>
          </div>

          {/* ── AI Insights ── */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 18 }}>✦</span>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>AI-Powered Insights</h2>
            </div>
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
                {[1,2,3].map(i => <Skeleton key={i} h={80} />)}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
                {insights.map((ins, i) => (
                  <div key={i} style={{ background: ins.bg, border: `1px solid ${ins.border}`, borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ color: ins.iconColor, fontSize: 16 }}>{ins.icon}</span>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: ins.iconColor }}>{ins.title}</p>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: 1.5 }}>{ins.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Charts ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 20, marginBottom: 24 }}>

            {/* Donut */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Spending by Category</h2>
              {loading ? <Skeleton h={220} /> : donutData.length === 0 ? (
                <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 14 }}>
                  No spending data yet
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                        {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: 12 }}>
                    {donutData.slice(0, 4).map((d) => (
                      <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color }} />
                          <span style={{ fontSize: "13px", color: "#475569" }}>{d.name}</span>
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{fmt(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Bar Chart */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Income vs Expense Trend</h2>
              {loading ? <Skeleton h={280} /> : (stats?.barData || []).length === 0 ? (
                <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 14 }}>
                  No data yet — add transactions to see trends
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stats.barData} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
                    <Bar dataKey="Income"  fill="#22c55e" radius={[4,4,0,0]} />
                    <Bar dataKey="Expense" fill="#ef4444" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Recent Transactions ── */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Recent Transactions</h2>
              <Link to="/transactions" style={{ fontSize: "13px", color: "#3b82f6", fontWeight: 500 }}>View All</Link>
            </div>

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1,2,3,4,5].map(i => <Skeleton key={i} h={48} />)}
              </div>
            ) : (stats?.recentTransactions || []).length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                No transactions yet.{" "}
                <Link to="/transactions" style={{ color: "#3b82f6", fontWeight: 600 }}>Add your first one →</Link>
              </div>
            ) : (
              (stats.recentTransactions).map((tx) => (
                <div key={tx._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: tx.type === "expense" ? "#fee2e2" : "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: tx.type === "expense" ? "#ef4444" : "#16a34a" }}>
                      {tx.type === "expense" ? "↗" : "↙"}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{tx.merchant}</p>
                      <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>{tx.category}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: tx.type === "expense" ? "#ef4444" : "#16a34a" }}>
                      {tx.type === "expense" ? "-" : "+"}{fmt(tx.amount)}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                        {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                      {tx.status && tx.status !== "Completed" && (
                        <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 7px", background: "#fef3c7", color: "#92400e", borderRadius: 99 }}>{tx.status}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
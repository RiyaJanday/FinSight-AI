import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { logout, setCredentials } from "../store/authSlice.js";
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
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, marginBottom: 4, cursor: "pointer", fontSize: "14px", fontWeight: label === "Reports" ? 600 : 400, color: label === "Reports" ? "#2563eb" : "#64748b", background: label === "Reports" ? "#eff6ff" : "transparent" }}>
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

export default function Reports() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const now          = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [month,     setMonth]     = useState(currentMonth);
  const [loading,   setLoading]   = useState(false);

  const handleLogout = async () => {
    try { await api.post("/auth/logout", { refreshToken: localStorage.getItem("refreshToken") }); } catch {}
    dispatch(logout());
    navigate("/login");
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/reports?month=${month}`, {
        responseType: "blob",
      });

      const url      = window.URL.createObjectURL(new Blob([response.data]));
      const link     = document.createElement("a");
      link.href      = url;
      link.setAttribute("download", `FinSight-Report-${month}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Report downloaded!");
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  // Generate last 12 months options
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("default", { month: "long", year: "numeric" });
    monthOptions.push({ value, label });
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", background: "#f8fafc" }}>

      <Sidebar onNavigate={(path) => navigate(path)} user={user} onLogout={handleLogout} />

      <div style={{ flex: 1, overflowY: "auto" }}>

        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 32px", position: "sticky", top: 0, zIndex: 10 }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Reports</h1>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Download detailed PDF financial reports</p>
        </div>

        <div style={{ padding: "28px 32px" }}>

          {/* Report Generator Card */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "32px", maxWidth: 600, marginBottom: 24 }}>
            <div style={{ fontSize: "48px", marginBottom: 16 }}>📋</div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
              Monthly Financial Report
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px", lineHeight: 1.6 }}>
              Generate a comprehensive PDF report including income vs expenses,
              spending by category, budget performance, and savings goals progress.
            </p>

            {/* Month selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
                Select Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", fontSize: "14px", border: "1.5px solid #e2e8f0", borderRadius: 8, outline: "none", color: "#0f172a", background: "#f8fafc" }}
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* What's included */}
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "16px", marginBottom: 24 }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#374151", margin: "0 0 10px" }}>Report includes:</p>
              {[
                "Income vs Expense Summary",
                "Spending Breakdown by Category",
                "Budget Performance Overview",
                "Savings Goals Progress",
                "Complete Transaction List",
              ].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: "#22c55e", fontSize: 14 }}>✓</span>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleDownload}
              disabled={loading}
              style={{
                width: "100%", padding: "13px",
                background: loading ? "#94a3b8" : "linear-gradient(135deg,#3b82f6,#1d4ed8)",
                color: "#fff", border: "none", borderRadius: 10,
                fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Generating PDF..." : "⬇ Download PDF Report"}
            </button>
          </div>

          {/* Info cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            {[
              { icon: "🔒", title: "Private & Secure", desc: "Reports are generated on-demand and never stored on our servers." },
              { icon: "📊", title: "Real Data", desc: "All figures come directly from your transaction history." },
              { icon: "📱", title: "Share Ready", desc: "Clean PDF format ready to share with accountants or advisors." },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px" }}>
                <p style={{ fontSize: "28px", margin: "0 0 10px" }}>{icon}</p>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>{title}</p>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
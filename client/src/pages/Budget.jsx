import { useState, useEffect } from "react";
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

const CATEGORIES = [
  { name: "Food & Dining",  color: "#3b82f6", icon: "🍽" },
  { name: "Transportation", color: "#22c55e", icon: "🚗" },
  { name: "Shopping",       color: "#a855f7", icon: "🛍" },
  { name: "Entertainment",  color: "#f59e0b", icon: "🎬" },
  { name: "Utilities",      color: "#ef4444", icon: "💡" },
  { name: "Health",         color: "#14b8a6", icon: "❤" },
  { name: "Others",         color: "#6b7280", icon: "📦" },
];

const fmt = (n) => "₹" + Math.abs(Number(n) || 0).toLocaleString("en-IN");

const inputStyle = {
  width: "100%", padding: "10px 12px", fontSize: "14px",
  border: "1.5px solid #e2e8f0", borderRadius: "8px",
  outline: "none", color: "#0f172a", background: "#f8fafc",
  boxSizing: "border-box",
};

// ── Sidebar ───────────────────────────────────────────────────
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
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, marginBottom: 4, cursor: "pointer", fontSize: "14px", fontWeight: label === "Budgets" ? 600 : 400, color: label === "Budgets" ? "#2563eb" : "#64748b", background: label === "Budgets" ? "#eff6ff" : "transparent" }}>
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

// ── Add / Edit Budget Modal ───────────────────────────────────
function BudgetModal({ existing, usedCategories, onClose, onSave }) {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    category: existing?.category || "",
    limit:    existing?.limit    || "",
    color:    existing?.color    || "#3b82f6",
  });
  const [loading, setLoading] = useState(false);

  const availableCategories = isEdit
    ? CATEGORIES
    : CATEGORIES.filter((c) => !usedCategories.includes(c.name));

  useEffect(() => {
    if (!isEdit && availableCategories.length > 0 && !form.category) {
      const cat = availableCategories[0];
      setForm((f) => ({ ...f, category: cat.name, color: cat.color }));
    }
  }, []);

  const handleCategoryChange = (name) => {
    const cat = CATEGORIES.find((c) => c.name === name);
    setForm({ ...form, category: name, color: cat?.color || "#3b82f6" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.limit) {
      toast.error("Category and limit are required"); return;
    }
    setLoading(true);
    try {
      let res;
      if (isEdit) {
        res = await api.put(`/budget/${existing._id}`, form);
      } else {
        res = await api.post("/budget", form);
      }
      onSave(res.data.budget, isEdit);
      toast.success(isEdit ? "Budget updated!" : "Budget created!");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save budget");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            {isEdit ? "Edit Budget" : "Add Budget"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Category */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Category</label>
            {isEdit ? (
              <div style={{ padding: "10px 12px", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#64748b" }}>
                {existing.category}
              </div>
            ) : (
              <select
                value={form.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                style={inputStyle}
              >
                {availableCategories.length === 0 ? (
                  <option>All categories have budgets</option>
                ) : (
                  availableCategories.map((c) => (
                    <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                  ))
                )}
              </select>
            )}
          </div>

          {/* Monthly Limit */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Monthly Limit (₹)</label>
            <input
              type="number" min="1"
              value={form.limit}
              onChange={(e) => setForm({ ...form, limit: e.target.value })}
              placeholder="e.g. 10000"
              style={inputStyle}
            />
          </div>

          {/* Color picker */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Color</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["#3b82f6","#22c55e","#a855f7","#f59e0b","#ef4444","#14b8a6","#6b7280","#f97316"].map((c) => (
                <div key={c} onClick={() => setForm({ ...form, color: c })}
                  style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: form.color === c ? "3px solid #0f172a" : "3px solid transparent" }} />
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "11px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: "14px", fontWeight: 600, color: "#64748b", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading || (!isEdit && availableCategories.length === 0)}
              style={{ flex: 1, padding: "11px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", fontSize: "14px", fontWeight: 700, color: "#fff", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Budget"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────
function ProgressBar({ percent, color, isOverspent }) {
  return (
    <div style={{ height: 8, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: 99,
        width: `${Math.min(percent, 100)}%`,
        background: isOverspent ? "#ef4444" : percent >= 80 ? "#f59e0b" : color,
        transition: "width 0.4s ease",
      }} />
    </div>
  );
}

// ── Main Budget Page ──────────────────────────────────────────
export default function Budget() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [budgets,     setBudgets]     = useState([]);
  const [summary,     setSummary]     = useState({ totalBudget: 0, totalSpent: 0, totalPercent: 0 });
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editBudget,  setEditBudget]  = useState(null);
  const [month,       setMonth]       = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const handleLogout = async () => {
    try { await api.post("/auth/logout", { refreshToken: localStorage.getItem("refreshToken") }); } catch {}
    dispatch(logout());
    navigate("/login");
  };

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/budget?month=${month}`);
      setBudgets(res.data.budgets);
      setSummary(res.data.summary);
    } catch {
      toast.error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBudgets(); }, [month]);

  const handleSave = (budget, isEdit) => {
    if (isEdit) {
      setBudgets((prev) => prev.map((b) => b._id === budget._id ? { ...b, ...budget } : b));
    } else {
      fetchBudgets(); // refresh to get spent amounts
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this budget?")) return;
    try {
      await api.delete(`/budget/${id}`);
      setBudgets((prev) => prev.filter((b) => b._id !== id));
      toast.success("Budget deleted");
    } catch {
      toast.error("Failed to delete budget");
    }
  };

  const usedCategories = budgets.map((b) => b.category);

  const getCategoryIcon = (name) =>
    CATEGORIES.find((c) => c.name === name)?.icon || "📦";

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", background: "#f8fafc" }}>

      <Sidebar onNavigate={(path) => navigate(path)} user={user} onLogout={handleLogout} />

      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* Top bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Budgets</h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Set and track your monthly spending limits</p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {/* Month picker */}
            <input
              type="month" value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{ padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: "13px", color: "#0f172a", outline: "none" }}
            />
            <button onClick={() => setShowModal(true)}
              style={{ padding: "10px 20px", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: 10, fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
              + Add Budget
            </button>
          </div>
        </div>

        <div style={{ padding: "28px 32px" }}>

          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Total Budget",  value: fmt(summary.totalBudget), color: "#0f172a"  },
              { label: "Total Spent",   value: fmt(summary.totalSpent),  color: "#ef4444"  },
              { label: "Overall Usage", value: `${summary.totalPercent}%`, color: summary.totalPercent >= 90 ? "#ef4444" : summary.totalPercent >= 70 ? "#f59e0b" : "#16a34a" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px" }}>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                <p style={{ fontSize: "24px", fontWeight: 700, color, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Overall progress */}
          {budgets.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 24px", marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>Overall Monthly Budget</span>
                <span style={{ fontSize: "14px", color: "#64748b" }}>{fmt(summary.totalSpent)} / {fmt(summary.totalBudget)}</span>
              </div>
              <ProgressBar
                percent={summary.totalPercent}
                color="#3b82f6"
                isOverspent={summary.totalPercent > 100}
              />
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: "8px 0 0" }}>
                {summary.totalPercent >= 100
                  ? "⚠ You have exceeded your total budget"
                  : `${fmt(summary.totalBudget - summary.totalSpent)} remaining`}
              </p>
            </div>
          )}

          {/* Budget Cards */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "20px", border: "1px solid #e2e8f0", height: 180 }} />
              ))}
            </div>
          ) : budgets.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "60px 32px", textAlign: "center" }}>
              <p style={{ fontSize: "40px", margin: "0 0 12px" }}>🎯</p>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", margin: "0 0 6px" }}>No budgets set</p>
              <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 20px" }}>Create your first budget to start tracking spending</p>
              <button onClick={() => setShowModal(true)}
                style={{ padding: "10px 24px", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: 10, fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                + Add Your First Budget
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
              {budgets.map((budget) => (
                <div key={budget._id} style={{ background: "#fff", border: `1px solid ${budget.isOverspent ? "#fca5a5" : "#e2e8f0"}`, borderRadius: 16, padding: "20px 24px", position: "relative" }}>

                  {/* Overspent badge */}
                  {budget.isOverspent && (
                    <div style={{ position: "absolute", top: 16, right: 16, background: "#fee2e2", color: "#ef4444", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>
                      Overspent
                    </div>
                  )}

                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: budget.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                      {getCategoryIcon(budget.category)}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{budget.category}</p>
                      <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                        {budget.month}
                      </p>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", marginBottom: 2 }}>Spent</p>
                      <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: budget.isOverspent ? "#ef4444" : "#0f172a" }}>
                        {fmt(budget.spent)}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", marginBottom: 2 }}>Limit</p>
                      <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#64748b" }}>
                        {fmt(budget.limit)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <ProgressBar
                    percent={budget.percent}
                    color={budget.color}
                    isOverspent={budget.isOverspent}
                  />

                  {/* Percent + remaining */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: budget.isOverspent ? "#ef4444" : budget.percent >= 80 ? "#f59e0b" : "#16a34a" }}>
                      {budget.percent}% used
                    </span>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                      {budget.isOverspent
                        ? `₹${(budget.spent - budget.limit).toLocaleString("en-IN")} over`
                        : `${fmt(budget.remaining)} left`}
                    </span>
                  </div>

                  {/* Warning strip */}
                  {!budget.isOverspent && budget.percent >= 80 && (
                    <div style={{ marginTop: 12, background: "#fef3c7", borderRadius: 8, padding: "8px 12px", fontSize: "12px", color: "#92400e" }}>
                      ⚠ You've used {budget.percent}% of this budget
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button onClick={() => setEditBudget(budget)}
                      style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#3b82f6", cursor: "pointer" }}>
                      Edit Limit
                    </button>
                    <button onClick={() => handleDelete(budget._id)}
                      style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1.5px solid #fee2e2", background: "#fee2e2", fontSize: "13px", fontWeight: 600, color: "#ef4444", cursor: "pointer" }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <BudgetModal
          usedCategories={usedCategories}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {editBudget && (
        <BudgetModal
          existing={editBudget}
          usedCategories={usedCategories}
          onClose={() => setEditBudget(null)}
          onSave={(b) => { handleSave(b, true); fetchBudgets(); }}
        />
      )}
    </div>
  );
}
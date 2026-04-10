import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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

const GOAL_CATEGORIES = [
  { name: "Emergency Fund", icon: "🛡" },
  { name: "Vacation",       icon: "✈" },
  { name: "Car",            icon: "🚗" },
  { name: "Home",           icon: "🏠" },
  { name: "Education",      icon: "📚" },
  { name: "Investment",     icon: "📈" },
  { name: "Wedding",        icon: "💍" },
  { name: "Other",          icon: "🎯" },
];

const COLORS = [
  "#3b82f6","#22c55e","#a855f7",
  "#f59e0b","#ef4444","#14b8a6",
  "#f97316","#6b7280",
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
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, marginBottom: 4, cursor: "pointer", fontSize: "14px", fontWeight: label === "Goals" ? 600 : 400, color: label === "Goals" ? "#2563eb" : "#64748b", background: label === "Goals" ? "#eff6ff" : "transparent" }}>
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

// ── Progress Bar ──────────────────────────────────────────────
function ProgressBar({ percent, color }) {
  return (
    <div style={{ height: 10, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: 99,
        width: `${Math.min(percent, 100)}%`,
        background: percent >= 100 ? "#22c55e" : color,
        transition: "width 0.5s ease",
      }} />
    </div>
  );
}

// ── Goal Modal (Add / Edit) ───────────────────────────────────
function GoalModal({ existing, onClose, onSave }) {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    title:        existing?.title        || "",
    targetAmount: existing?.targetAmount || "",
    deadline:     existing?.deadline
      ? new Date(existing.deadline).toISOString().split("T")[0]
      : "",
    category:     existing?.category    || "Other",
    color:        existing?.color       || "#3b82f6",
    icon:         existing?.icon        || "🎯",
    notes:        existing?.notes       || "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleCategoryChange = (name) => {
    const cat = GOAL_CATEGORIES.find((c) => c.name === name);
    setForm({ ...form, category: name, icon: cat?.icon || "🎯" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.targetAmount || !form.deadline) {
      toast.error("Title, target amount and deadline are required");
      return;
    }
    setLoading(true);
    try {
      let res;
      if (isEdit) {
        res = await api.put(`/goals/${existing._id}`, form);
      } else {
        res = await api.post("/goals", form);
      }
      onSave(res.data.goal, isEdit);
      toast.success(isEdit ? "Goal updated!" : "Goal created!");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save goal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            {isEdit ? "Edit Goal" : "Create New Goal"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Goal Title</label>
            <input name="title" value={form.title} onChange={handleChange}
              placeholder="e.g. Emergency Fund" style={inputStyle} required />
          </div>

          {/* Category */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Category</label>
            <select value={form.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              style={inputStyle}>
              {GOAL_CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Target Amount */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Target Amount (₹)</label>
            <input name="targetAmount" type="number" min="1"
              value={form.targetAmount} onChange={handleChange}
              placeholder="e.g. 100000" style={inputStyle} required />
          </div>

          {/* Deadline */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Target Date</label>
            <input name="deadline" type="date"
              value={form.deadline} onChange={handleChange}
              min={new Date().toISOString().split("T")[0]}
              style={inputStyle} required />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Notes (optional)</label>
            <input name="notes" value={form.notes} onChange={handleChange}
              placeholder="Any notes about this goal..." style={inputStyle} />
          </div>

          {/* Color */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Color</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {COLORS.map((c) => (
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
            <button type="submit" disabled={loading}
              style={{ flex: 1, padding: "11px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", fontSize: "14px", fontWeight: 700, color: "#fff", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Contribute Modal ──────────────────────────────────────────
function ContributeModal({ goal, onClose, onContribute }) {
  const [amount,  setAmount]  = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter a valid amount"); return;
    }
    if (parseFloat(amount) > goal.remaining) {
      toast.error(`Max contribution is ${fmt(goal.remaining)}`); return;
    }
    setLoading(true);
    try {
      const res = await api.put(`/goals/${goal._id}/contribute`, { amount: parseFloat(amount) });
      onContribute(res.data.goal);
      toast.success(`₹${parseFloat(amount).toLocaleString("en-IN")} added to ${goal.title}!`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add contribution");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Add Contribution</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>✕</button>
        </div>

        {/* Goal info */}
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{goal.icon} {goal.title}</p>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
            {fmt(goal.savedAmount)} saved of {fmt(goal.targetAmount)}
          </p>
          <div style={{ marginTop: 8 }}>
            <ProgressBar percent={goal.percent} color={goal.color} />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              Amount to add (₹) — max {fmt(goal.remaining)}
            </label>
            <input
              type="number" min="1" max={goal.remaining}
              value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              style={inputStyle} autoFocus
            />
          </div>

          {/* Quick amounts */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {[1000, 5000, 10000, 25000].filter(a => a <= goal.remaining).map((a) => (
              <button key={a} type="button"
                onClick={() => setAmount(a)}
                style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: amount == a ? "#eff6ff" : "#fff", color: amount == a ? "#2563eb" : "#64748b", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                +{fmt(a)}
              </button>
            ))}
            <button type="button"
              onClick={() => setAmount(goal.remaining)}
              style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: amount == goal.remaining ? "#dcfce7" : "#fff", color: "#16a34a", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
              Full {fmt(goal.remaining)}
            </button>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "11px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: "14px", fontWeight: 600, color: "#64748b", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              style={{ flex: 1, padding: "11px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#22c55e,#15803d)", fontSize: "14px", fontWeight: 700, color: "#fff", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Adding..." : "Add Money"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Goals Page ───────────────────────────────────────────
export default function Goals() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [goals,       setGoals]       = useState([]);
  const [summary,     setSummary]     = useState({ totalGoals: 0, completedGoals: 0, totalSaved: 0, totalTarget: 0 });
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editGoal,    setEditGoal]    = useState(null);
  const [contributeGoal, setContributeGoal] = useState(null);
  const [filter,      setFilter]      = useState("All");

  const handleLogout = async () => {
    try { await api.post("/auth/logout", { refreshToken: localStorage.getItem("refreshToken") }); } catch {}
    dispatch(logout());
    navigate("/login");
  };

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await api.get("/goals");
      setGoals(res.data.goals);
      setSummary(res.data.summary);
    } catch {
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleSave = (goal, isEdit) => {
    if (isEdit) {
      setGoals((prev) => prev.map((g) => g._id === goal._id ? { ...g, ...goal } : g));
    } else {
      fetchGoals();
    }
  };

  const handleContribute = (updatedGoal) => {
    setGoals((prev) => prev.map((g) => {
      if (g._id !== updatedGoal._id) return g;
      const percent     = Math.min(Math.round((updatedGoal.savedAmount / updatedGoal.targetAmount) * 100), 100);
      const remaining   = Math.max(updatedGoal.targetAmount - updatedGoal.savedAmount, 0);
      const isCompleted = updatedGoal.savedAmount >= updatedGoal.targetAmount;
      return { ...g, ...updatedGoal, percent, remaining, isCompleted };
    }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this goal?")) return;
    try {
      await api.delete(`/goals/${id}`);
      setGoals((prev) => prev.filter((g) => g._id !== id));
      toast.success("Goal deleted");
    } catch {
      toast.error("Failed to delete goal");
    }
  };

  const filteredGoals = goals.filter((g) => {
    if (filter === "Active")    return !g.isCompleted && !g.isOverdue;
    if (filter === "Completed") return g.isCompleted;
    if (filter === "Overdue")   return g.isOverdue;
    return true;
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", background: "#f8fafc" }}>

      <Sidebar onNavigate={(path) => navigate(path)} user={user} onLogout={handleLogout} />

      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* Top bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Savings Goals</h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Track and achieve your financial goals</p>
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ padding: "10px 20px", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: 10, fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
            + New Goal
          </button>
        </div>

        <div style={{ padding: "28px 32px" }}>

          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Total Goals",     value: summary.totalGoals,                    color: "#0f172a", fmt: false },
              { label: "Completed",       value: summary.completedGoals,                color: "#16a34a", fmt: false },
              { label: "Total Saved",     value: fmt(summary.totalSaved),               color: "#3b82f6", fmt: false },
              { label: "Total Target",    value: fmt(summary.totalTarget),              color: "#64748b", fmt: false },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px" }}>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                <p style={{ fontSize: "22px", fontWeight: 700, color, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {["All", "Active", "Completed", "Overdue"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: "7px 16px", borderRadius: 8, border: "1.5px solid", fontSize: "13px", fontWeight: 500, cursor: "pointer", borderColor: filter === f ? "#3b82f6" : "#e2e8f0", background: filter === f ? "#eff6ff" : "#fff", color: filter === f ? "#2563eb" : "#64748b" }}>
                {f}
              </button>
            ))}
          </div>

          {/* Goals Grid */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ background: "#fff", borderRadius: 16, height: 260, border: "1px solid #e2e8f0" }} />
              ))}
            </div>
          ) : filteredGoals.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "60px 32px", textAlign: "center" }}>
              <p style={{ fontSize: "40px", margin: "0 0 12px" }}>◎</p>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", margin: "0 0 6px" }}>
                {filter === "All" ? "No goals yet" : `No ${filter.toLowerCase()} goals`}
              </p>
              <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 20px" }}>
                {filter === "All" ? "Create your first savings goal to get started" : `You have no ${filter.toLowerCase()} goals right now`}
              </p>
              {filter === "All" && (
                <button onClick={() => setShowModal(true)}
                  style={{ padding: "10px 24px", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: 10, fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                  + Create First Goal
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
              {filteredGoals.map((goal) => (
                <div key={goal._id} style={{
                  background: "#fff",
                  border: `1px solid ${goal.isCompleted ? "#bbf7d0" : goal.isOverdue ? "#fca5a5" : "#e2e8f0"}`,
                  borderRadius: 16, padding: "20px 24px",
                  position: "relative",
                }}>
                  {/* Status badge */}
                  {goal.isCompleted && (
                    <div style={{ position: "absolute", top: 16, right: 16, background: "#dcfce7", color: "#16a34a", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>
                      Completed ✓
                    </div>
                  )}
                  {goal.isOverdue && !goal.isCompleted && (
                    <div style={{ position: "absolute", top: 16, right: 16, background: "#fee2e2", color: "#ef4444", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>
                      Overdue
                    </div>
                  )}

                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: goal.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                      {goal.icon}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{goal.title}</p>
                      <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>{goal.category}</p>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", marginBottom: 2 }}>Saved</p>
                      <p style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: goal.isCompleted ? "#16a34a" : "#0f172a" }}>
                        {fmt(goal.savedAmount)}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", marginBottom: 2 }}>Target</p>
                      <p style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#64748b" }}>
                        {fmt(goal.targetAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <ProgressBar percent={goal.percent} color={goal.color} />

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: goal.isCompleted ? "#16a34a" : goal.color }}>
                      {goal.percent}% complete
                    </span>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                      {goal.isCompleted
                        ? "Goal achieved!"
                        : goal.isOverdue
                        ? `${Math.abs(goal.daysLeft)} days overdue`
                        : `${goal.daysLeft} days left`}
                    </span>
                  </div>

                  {/* Monthly needed */}
                  {!goal.isCompleted && !goal.isOverdue && (
                    <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 12px", marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>Monthly needed</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>{fmt(goal.monthlyNeeded)}</span>
                    </div>
                  )}

                  {/* Deadline */}
                  <div style={{ marginBottom: 14 }}>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                      Target date: {new Date(goal.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 8 }}>
                    {!goal.isCompleted && (
                      <button onClick={() => setContributeGoal(goal)}
                        style={{ flex: 2, padding: "8px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#22c55e,#15803d)", fontSize: "13px", fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                        + Add Money
                      </button>
                    )}
                    <button onClick={() => setEditGoal(goal)}
                      style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#3b82f6", cursor: "pointer" }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(goal._id)}
                      style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1.5px solid #fee2e2", background: "#fee2e2", fontSize: "13px", fontWeight: 600, color: "#ef4444", cursor: "pointer" }}>
                      Del
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <GoalModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
      {editGoal && (
        <GoalModal existing={editGoal} onClose={() => setEditGoal(null)} onSave={(g) => { handleSave(g, true); fetchGoals(); }} />
      )}
      {contributeGoal && (
        <ContributeModal goal={contributeGoal} onClose={() => setContributeGoal(null)} onContribute={handleContribute} />
      )}
    </div>
  );
}
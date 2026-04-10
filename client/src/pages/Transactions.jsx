import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { logout } from "../store/authSlice.js";
import api from "../services/api.js";

const categories = [
  "All", "Food & Dining", "Transportation", "Shopping",
  "Entertainment", "Utilities", "Health", "Income", "Others",
];

const navItems = [
  { label: "Dashboard",    icon: "⊞", path: "/dashboard"    },
  { label: "Accounts",     icon: "🏦", path: "/accounts"     },
  { label: "Transactions", icon: "💱", path: "/transactions" },
  { label: "Budgets",      icon: "🎯", path: "/budget"       },
  { label: "Goals",        icon: "◎", path: "/goals"        },
  { label: "Reports",      icon: "📋", path: "/reports"      },
  { label: "Settings",     icon: "⚙", path: "/settings"     },
];

const categoryColors = {
  "Food & Dining":  { bg: "#dbeafe", color: "#1d4ed8" },
  "Transportation": { bg: "#dcfce7", color: "#15803d" },
  "Shopping":       { bg: "#ede9fe", color: "#6d28d9" },
  "Entertainment":  { bg: "#fef3c7", color: "#92400e" },
  "Utilities":      { bg: "#fee2e2", color: "#991b1b" },
  "Health":         { bg: "#ecfdf5", color: "#065f46" },
  "Income":         { bg: "#dcfce7", color: "#15803d" },
  "Others":         { bg: "#f1f5f9", color: "#475569" },
};

const fmt = (n) => "₹" + Math.abs(Number(n) || 0).toLocaleString("en-IN");

const inputStyle = {
  width: "100%", padding: "10px 12px", fontSize: "14px",
  border: "1.5px solid #e2e8f0", borderRadius: "8px",
  outline: "none", color: "#0f172a", background: "#f8fafc",
  boxSizing: "border-box",
};

// ── Add Transaction Modal ─────────────────────────────────────
function AddTransactionModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    merchant: "",
    category: "Food & Dining",
    amount: "",
    type: "expense",
    date: new Date().toISOString().split("T")[0],
    account: "Primary",
    notes: "",
    status: "Completed",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.merchant || !form.amount) {
      toast.error("Merchant and amount are required");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/transactions", form);
      onAdd(res.data.transaction);
      toast.success("Transaction added!");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "28px 32px",
        width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Add Transaction</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Type toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["expense", "income"].map((t) => (
              <button key={t} type="button"
                onClick={() => setForm({ ...form, type: t })}
                style={{
                  flex: 1, padding: "9px", borderRadius: 8, border: "1.5px solid",
                  fontSize: "13px", fontWeight: 600, cursor: "pointer",
                  borderColor: form.type === t ? (t === "expense" ? "#ef4444" : "#22c55e") : "#e2e8f0",
                  background:  form.type === t ? (t === "expense" ? "#fee2e2" : "#dcfce7") : "#fff",
                  color:       form.type === t ? (t === "expense" ? "#ef4444" : "#16a34a") : "#64748b",
                }}>
                {t === "expense" ? "↗ Expense" : "↙ Income"}
              </button>
            ))}
          </div>

          {/* Merchant */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              Merchant / Description
            </label>
            <input
              name="merchant" value={form.merchant}
              onChange={handleChange} placeholder="e.g. Zomato Order"
              style={inputStyle} required
            />
          </div>

          {/* Amount */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              Amount (₹)
            </label>
            <input
              name="amount" type="number" min="0"
              value={form.amount} onChange={handleChange}
              placeholder="0.00" style={inputStyle} required
            />
          </div>

          {/* Category */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              Category
            </label>
            <select name="category" value={form.category} onChange={handleChange} style={inputStyle}>
              {categories.filter(c => c !== "All").map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              Date
            </label>
            <input
              name="date" type="date"
              value={form.date} onChange={handleChange}
              style={inputStyle}
            />
          </div>

          {/* Account */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              Account
            </label>
            <input
              name="account" value={form.account}
              onChange={handleChange} placeholder="e.g. HDFC Savings"
              style={inputStyle}
            />
          </div>

          {/* Status */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              Status
            </label>
            <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              Notes (optional)
            </label>
            <input
              name="notes" value={form.notes}
              onChange={handleChange} placeholder="Any additional notes..."
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: "11px", borderRadius: 8,
              border: "1.5px solid #e2e8f0", background: "#fff",
              fontSize: "14px", fontWeight: 600, color: "#64748b", cursor: "pointer",
            }}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              flex: 1, padding: "11px", borderRadius: 8, border: "none",
              background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
              fontSize: "14px", fontWeight: 700, color: "#fff", cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}>{loading ? "Adding..." : "Add Transaction"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Transaction Modal ────────────────────────────────────
function EditTransactionModal({ tx, onClose, onUpdate }) {
  const [form, setForm] = useState({
    merchant: tx.merchant,
    category: tx.category,
    amount:   Math.abs(tx.amount),
    type:     tx.type,
    date:     new Date(tx.date).toISOString().split("T")[0],
    account:  tx.account || "",
    notes:    tx.notes   || "",
    status:   tx.status  || "Completed",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put(`/transactions/${tx._id}`, form);
      onUpdate(res.data.transaction);
      toast.success("Transaction updated!");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "28px 32px",
        width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Edit Transaction</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["expense", "income"].map((t) => (
              <button key={t} type="button"
                onClick={() => setForm({ ...form, type: t })}
                style={{
                  flex: 1, padding: "9px", borderRadius: 8, border: "1.5px solid",
                  fontSize: "13px", fontWeight: 600, cursor: "pointer",
                  borderColor: form.type === t ? (t === "expense" ? "#ef4444" : "#22c55e") : "#e2e8f0",
                  background:  form.type === t ? (t === "expense" ? "#fee2e2" : "#dcfce7") : "#fff",
                  color:       form.type === t ? (t === "expense" ? "#ef4444" : "#16a34a") : "#64748b",
                }}>
                {t === "expense" ? "↗ Expense" : "↙ Income"}
              </button>
            ))}
          </div>

          {[
            { label: "Merchant", name: "merchant", type: "text",   placeholder: "Merchant name" },
            { label: "Amount (₹)", name: "amount", type: "number", placeholder: "0.00" },
            { label: "Date",     name: "date",     type: "date",   placeholder: "" },
            { label: "Account",  name: "account",  type: "text",   placeholder: "Account name" },
            { label: "Notes",    name: "notes",    type: "text",   placeholder: "Optional notes" },
          ].map(({ label, name, type, placeholder }) => (
            <div key={name} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{label}</label>
              <input name={name} type={type} value={form[name]} onChange={handleChange} placeholder={placeholder} style={inputStyle} />
            </div>
          ))}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Category</label>
            <select name="category" value={form.category} onChange={handleChange} style={inputStyle}>
              {categories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Status</label>
            <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: "14px", fontWeight: 600, color: "#64748b", cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: "11px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", fontSize: "14px", fontWeight: 700, color: "#fff", cursor: "pointer" }}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sidebar Component ─────────────────────────────────────────
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
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {navItems.map(({ label, icon, path }) => {
          const active = activePage === label;
          return (
            <div key={label} onClick={() => onNavigate(label, path)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, marginBottom: 4, cursor: "pointer", fontSize: "14px", fontWeight: active ? 600 : 400, color: active ? "#2563eb" : "#64748b", background: active ? "#eff6ff" : "transparent" }}>
              <span style={{ fontSize: 16 }}>{icon}</span>{label}
            </div>
          );
        })}
      </nav>
      <div style={{ padding: "16px 20px", borderTop: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#3b82f6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{initials}</div>
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name || "User"}</p>
            <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email || ""}</p>
          </div>
        </div>
        <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#ef4444", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
          <span>→</span> Logout
        </button>
      </div>
    </div>
  );
}

// ── Main Transactions Page ────────────────────────────────────
export default function Transactions() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [transactions,   setTransactions]  = useState([]);
  const [summary,        setSummary]       = useState({ income: 0, expense: 0, net: 0 });
  const [pagination,     setPagination]    = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading,        setLoading]       = useState(false);
  const [search,         setSearch]        = useState("");
  const [activeCategory, setCategory]      = useState("All");
  const [activeType,     setType]          = useState("All");
  const [showAddModal,   setShowAddModal]  = useState(false);
  const [editTx,         setEditTx]        = useState(null);
  const [currentPage,    setCurrentPage]   = useState(1);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      await api.post("/auth/logout", { refreshToken });
    } catch {}
    dispatch(logout());
    navigate("/login");
  };

  // ── Fetch from API ────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)                    params.append("search",   search);
      if (activeCategory !== "All") params.append("category", activeCategory);
      if (activeType !== "All")     params.append("type",     activeType);
      params.append("page",  currentPage);
      params.append("limit", 20);

      const res = await api.get(`/transactions?${params}`);
      setTransactions(res.data.transactions);
      setSummary(res.data.summary);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory, activeType, currentPage]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // ── Handlers ──────────────────────────────────────────────
  const handleAdd = (newTx) => {
    setTransactions((prev) => [newTx, ...prev]);
    fetchTransactions();
  };

  const handleUpdate = (updatedTx) => {
    setTransactions((prev) =>
      prev.map((t) => (t._id === updatedTx._id ? updatedTx : t))
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions((prev) => prev.filter((t) => t._id !== id));
      toast.success("Transaction deleted");
      fetchTransactions();
    } catch {
      toast.error("Failed to delete transaction");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", background: "#f8fafc" }}>

      <Sidebar
        activePage="Transactions"
        onNavigate={(label, path) => navigate(path)}
        user={user}
        onLogout={handleLogout}
      />

      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* Top bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Transactions</h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Track and manage all your transactions</p>
          </div>
          <button onClick={() => setShowAddModal(true)} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: 10, fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
            + Add Transaction
          </button>
        </div>

        <div style={{ padding: "28px 32px" }}>

          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Total Transactions", value: pagination.total,    color: "#0f172a", fmt: false },
              { label: "Total Income",       value: summary.income,      color: "#16a34a", fmt: true  },
              { label: "Total Expenses",     value: summary.expense,     color: "#ef4444", fmt: true  },
            ].map(({ label, value, color, fmt: doFmt }) => (
              <div key={label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "18px 20px" }}>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                <p style={{ fontSize: "24px", fontWeight: 700, color, margin: 0 }}>
                  {doFmt ? fmt(value) : value}
                </p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              {/* Search */}
              <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  placeholder="Search by merchant or category..."
                  style={{ width: "100%", padding: "9px 12px 9px 34px", fontSize: "14px", border: "1.5px solid #e2e8f0", borderRadius: 8, outline: "none", color: "#0f172a", background: "#f8fafc", boxSizing: "border-box" }}
                />
              </div>

              {/* Type filter */}
              <div style={{ display: "flex", gap: 6 }}>
                {["All", "income", "expense"].map((t) => (
                  <button key={t} onClick={() => { setType(t); setCurrentPage(1); }}
                    style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid", fontSize: "13px", fontWeight: 500, cursor: "pointer", borderColor: activeType === t ? "#3b82f6" : "#e2e8f0", background: activeType === t ? "#eff6ff" : "#fff", color: activeType === t ? "#2563eb" : "#64748b" }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Category pills */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
              {categories.map((c) => (
                <button key={c} onClick={() => { setCategory(c); setCurrentPage(1); }}
                  style={{ padding: "5px 12px", borderRadius: 99, border: "1.5px solid", fontSize: "12px", fontWeight: 500, cursor: "pointer", borderColor: activeCategory === c ? "#3b82f6" : "#e2e8f0", background: activeCategory === c ? "#eff6ff" : "#fff", color: activeCategory === c ? "#2563eb" : "#64748b" }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction Table */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>

            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1fr 0.8fr 0.6fr", gap: 12, padding: "12px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {["Merchant", "Category", "Account", "Date", "Amount", "Actions"].map((h) => (
                <p key={h} style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</p>
              ))}
            </div>

            {/* Loading */}
            {loading ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                Loading transactions...
              </div>
            ) : transactions.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center" }}>
                <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0 0 12px" }}>No transactions found</p>
                <button onClick={() => setShowAddModal(true)}
                  style={{ padding: "9px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  Add your first transaction
                </button>
              </div>
            ) : (
              transactions.map((tx) => {
                const cat = categoryColors[tx.category] || categoryColors["Others"];
                return (
                  <div key={tx._id}
                    style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1fr 0.8fr 0.6fr", gap: 12, padding: "14px 20px", alignItems: "center", borderBottom: "1px solid #f8fafc" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Merchant */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: tx.type === "expense" ? "#fee2e2" : "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: tx.type === "expense" ? "#ef4444" : "#16a34a" }}>
                        {tx.type === "expense" ? "↗" : "↙"}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{tx.merchant}</p>
                        {tx.status && tx.status !== "Completed" && (
                          <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 6px", background: tx.status === "Pending" ? "#fef3c7" : "#fee2e2", color: tx.status === "Pending" ? "#92400e" : "#991b1b", borderRadius: 99 }}>
                            {tx.status}
                          </span>
                        )}
                        {tx.notes && (
                          <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>{tx.notes}</p>
                        )}
                      </div>
                    </div>

                    {/* Category */}
                    <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: 99, background: cat.bg, color: cat.color, display: "inline-block" }}>
                      {tx.category}
                    </span>

                    {/* Account */}
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>{tx.account || "—"}</p>

                    {/* Date */}
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                      {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>

                    {/* Amount */}
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: tx.type === "expense" ? "#ef4444" : "#16a34a", textAlign: "right" }}>
                      {tx.type === "expense" ? "-" : "+"}{fmt(tx.amount)}
                    </p>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setEditTx(tx)}
                        style={{ background: "#eff6ff", border: "none", borderRadius: 6, padding: "5px 8px", fontSize: "12px", color: "#2563eb", cursor: "pointer", fontWeight: 600 }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(tx._id)}
                        style={{ background: "#fee2e2", border: "none", borderRadius: 6, padding: "5px 8px", fontSize: "12px", color: "#ef4444", cursor: "pointer", fontWeight: 600 }}>
                        Del
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 500, cursor: currentPage === 1 ? "not-allowed" : "pointer", color: currentPage === 1 ? "#94a3b8" : "#0f172a" }}>
                ← Prev
              </button>
              <span style={{ padding: "8px 16px", fontSize: "13px", color: "#64748b" }}>
                Page {currentPage} of {pagination.totalPages}
              </span>
              <button
                disabled={currentPage === pagination.totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 500, cursor: currentPage === pagination.totalPages ? "not-allowed" : "pointer", color: currentPage === pagination.totalPages ? "#94a3b8" : "#0f172a" }}>
                Next →
              </button>
            </div>
          )}

        </div>
      </div>

      {showAddModal && (
        <AddTransactionModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}

      {editTx && (
        <EditTransactionModal
          tx={editTx}
          onClose={() => setEditTx(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
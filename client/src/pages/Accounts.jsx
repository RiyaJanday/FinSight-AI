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

const ACCOUNT_TYPES = [
  { value: "checking",   label: "Checking",    icon: "💳", color: "#3b82f6" },
  { value: "savings",    label: "Savings",     icon: "🏦", color: "#22c55e" },
  { value: "credit",     label: "Credit Card", icon: "💜", color: "#a855f7" },
  { value: "investment", label: "Investment",  icon: "📈", color: "#f59e0b" },
  { value: "cash",       label: "Cash",        icon: "💵", color: "#14b8a6" },
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
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, marginBottom: 4, cursor: "pointer", fontSize: "14px", fontWeight: label === "Accounts" ? 600 : 400, color: label === "Accounts" ? "#2563eb" : "#64748b", background: label === "Accounts" ? "#eff6ff" : "transparent" }}>
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

// ── Account Modal ─────────────────────────────────────────────
function AccountModal({ existing, onClose, onSave }) {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    name:        existing?.name        || "",
    type:        existing?.type        || "checking",
    balance:     existing?.balance     || "",
    mask:        existing?.mask        || "",
    creditLimit: existing?.creditLimit || "",
    institution: existing?.institution || "",
    color:       existing?.color       || "#3b82f6",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleTypeChange = (type) => {
    const t = ACCOUNT_TYPES.find((a) => a.value === type);
    setForm({ ...form, type, color: t?.color || "#3b82f6" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.type) {
      toast.error("Name and type are required"); return;
    }
    setLoading(true);
    try {
      let res;
      if (isEdit) {
        res = await api.put(`/accounts/${existing._id}`, form);
      } else {
        res = await api.post("/accounts", form);
      }
      onSave(res.data.account, isEdit);
      toast.success(isEdit ? "Account updated!" : "Account added!");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            {isEdit ? "Edit Account" : "Add Account"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Account type */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Account Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {ACCOUNT_TYPES.map((t) => (
                <div key={t.value} onClick={() => handleTypeChange(t.value)}
                  style={{ padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${form.type === t.value ? t.color : "#e2e8f0"}`, background: form.type === t.value ? t.color + "15" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  <span style={{ fontSize: "13px", fontWeight: form.type === t.value ? 600 : 400, color: form.type === t.value ? t.color : "#64748b" }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Account Name</label>
            <input name="name" value={form.name} onChange={handleChange}
              placeholder="e.g. HDFC Savings Account" style={inputStyle} required />
          </div>

          {/* Balance */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              {form.type === "credit" ? "Current Outstanding (₹)" : "Current Balance (₹)"}
            </label>
            <input name="balance" type="number" value={form.balance} onChange={handleChange}
              placeholder="0.00" style={inputStyle} />
          </div>

          {/* Credit limit */}
          {form.type === "credit" && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Credit Limit (₹)</label>
              <input name="creditLimit" type="number" value={form.creditLimit} onChange={handleChange}
                placeholder="e.g. 100000" style={inputStyle} />
            </div>
          )}

          {/* Last 4 digits */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Last 4 Digits (optional)</label>
            <input name="mask" value={form.mask} onChange={handleChange}
              placeholder="e.g. 1234" maxLength={4} style={inputStyle} />
          </div>

          {/* Institution */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Bank / Institution</label>
            <input name="institution" value={form.institution} onChange={handleChange}
              placeholder="e.g. HDFC Bank" style={inputStyle} />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "11px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: "14px", fontWeight: 600, color: "#64748b", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              style={{ flex: 1, padding: "11px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", fontSize: "14px", fontWeight: 700, color: "#fff", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Accounts Page ────────────────────────────────────────
export default function Accounts() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [accounts,    setAccounts]    = useState([]);
  const [totalBalance,setTotalBalance]= useState(0);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editAccount, setEditAccount] = useState(null);

  const handleLogout = async () => {
    try { await api.post("/auth/logout", { refreshToken: localStorage.getItem("refreshToken") }); } catch {}
    dispatch(logout());
    navigate("/login");
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/accounts");
      setAccounts(res.data.accounts);
      setTotalBalance(res.data.totalBalance);
    } catch {
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleSave = (account, isEdit) => {
    if (isEdit) {
      setAccounts((prev) => prev.map((a) => a._id === account._id ? { ...a, ...account } : a));
    } else {
      fetchAccounts();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this account?")) return;
    try {
      await api.delete(`/accounts/${id}`);
      setAccounts((prev) => prev.filter((a) => a._id !== id));
      toast.success("Account deleted");
    } catch {
      toast.error("Failed to delete account");
    }
  };

  const getTypeInfo = (type) =>
    ACCOUNT_TYPES.find((t) => t.value === type) || ACCOUNT_TYPES[0];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", background: "#f8fafc" }}>

      <Sidebar onNavigate={(path) => navigate(path)} user={user} onLogout={handleLogout} />

      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* Top bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Accounts</h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Manage all your bank accounts</p>
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ padding: "10px 20px", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: 10, fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
            + Add Account
          </button>
        </div>

        <div style={{ padding: "28px 32px" }}>

          {/* Net Worth Card */}
          <div style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", borderRadius: 16, padding: "28px 32px", marginBottom: 24, color: "#fff" }}>
            <p style={{ margin: "0 0 4px", fontSize: "13px", opacity: 0.85 }}>Total Net Worth</p>
            <p style={{ margin: "0 0 16px", fontSize: "36px", fontWeight: 700, letterSpacing: "-1px" }}>
              {loading ? "Loading..." : fmt(totalBalance)}
            </p>
            <div style={{ display: "flex", gap: 24 }}>
              <div>
                <p style={{ margin: 0, fontSize: "12px", opacity: 0.75 }}>Total Accounts</p>
                <p style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>{accounts.length}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "12px", opacity: 0.75 }}>Assets</p>
                <p style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                  {fmt(accounts.filter(a => a.type !== "credit").reduce((s, a) => s + a.balance, 0))}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "12px", opacity: 0.75 }}>Credit Used</p>
                <p style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                  {fmt(accounts.filter(a => a.type === "credit").reduce((s, a) => s + a.balance, 0))}
                </p>
              </div>
            </div>
          </div>

          {/* Accounts Grid */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
              {[1,2,3].map(i => <div key={i} style={{ background: "#fff", borderRadius: 16, height: 200, border: "1px solid #e2e8f0" }} />)}
            </div>
          ) : accounts.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "60px 32px", textAlign: "center" }}>
              <p style={{ fontSize: "40px", margin: "0 0 12px" }}>🏦</p>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", margin: "0 0 6px" }}>No accounts yet</p>
              <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 20px" }}>Add your bank accounts to track your net worth</p>
              <button onClick={() => setShowModal(true)}
                style={{ padding: "10px 24px", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: 10, fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                + Add First Account
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
              {accounts.map((acc) => {
                const typeInfo  = getTypeInfo(acc.type);
                const isCredit  = acc.type === "credit";
                const utilization = isCredit && acc.creditLimit
                  ? Math.round((acc.balance / acc.creditLimit) * 100)
                  : null;

                return (
                  <div key={acc._id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px" }}>

                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: acc.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                          {typeInfo.icon}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{acc.name}</p>
                          <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                            {acc.institution || typeInfo.label}
                            {acc.mask ? ` • ****${acc.mask}` : ""}
                          </p>
                        </div>
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: acc.color + "20", color: acc.color }}>
                        {typeInfo.label}
                      </span>
                    </div>

                    {/* Balance */}
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ margin: "0 0 2px", fontSize: "12px", color: "#94a3b8" }}>
                        {isCredit ? "Outstanding Balance" : "Available Balance"}
                      </p>
                      <p style={{ margin: 0, fontSize: "26px", fontWeight: 700, color: isCredit ? "#ef4444" : "#0f172a" }}>
                        {fmt(acc.balance)}
                      </p>
                      {isCredit && acc.creditLimit && (
                        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                          Limit: {fmt(acc.creditLimit)}
                        </p>
                      )}
                    </div>

                    {/* Credit utilization bar */}
                    {utilization !== null && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>Credit Utilization</span>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: utilization >= 80 ? "#ef4444" : utilization >= 50 ? "#f59e0b" : "#16a34a" }}>
                            {utilization}%
                          </span>
                        </div>
                        <div style={{ height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 99, width: `${Math.min(utilization, 100)}%`, background: utilization >= 80 ? "#ef4444" : utilization >= 50 ? "#f59e0b" : "#22c55e" }} />
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div style={{ display: "flex", gap: 16, marginBottom: 16, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                      <div>
                        <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>Transactions</p>
                        <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#0f172a" }}>{acc.txCount || 0}</p>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>Currency</p>
                        <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#0f172a" }}>{acc.currency || "INR"}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setEditAccount(acc)}
                        style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#3b82f6", cursor: "pointer" }}>
                        Edit
                      </button>
                      <button onClick={() => navigate(`/transactions?account=${acc.name}`)}
                        style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#64748b", cursor: "pointer" }}>
                        View Tx
                      </button>
                      <button onClick={() => handleDelete(acc._id)}
                        style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1.5px solid #fee2e2", background: "#fee2e2", fontSize: "13px", fontWeight: 600, color: "#ef4444", cursor: "pointer" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showModal  && <AccountModal onClose={() => setShowModal(false)}   onSave={handleSave} />}
      {editAccount && <AccountModal existing={editAccount} onClose={() => setEditAccount(null)} onSave={handleSave} />}
    </div>
  );
}
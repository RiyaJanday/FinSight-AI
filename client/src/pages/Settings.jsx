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

const inputStyle = {
  width: "100%", padding: "10px 12px", fontSize: "14px",
  border: "1.5px solid #e2e8f0", borderRadius: "8px",
  outline: "none", color: "#0f172a", background: "#f8fafc",
  boxSizing: "border-box",
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
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, marginBottom: 4, cursor: "pointer", fontSize: "14px", fontWeight: label === "Settings" ? 600 : 400, color: label === "Settings" ? "#2563eb" : "#64748b", background: label === "Settings" ? "#eff6ff" : "transparent" }}>
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

export default function Settings() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [profile, setProfile] = useState({
    name:     user?.name     || "",
    phone:    user?.phone    || "",
    currency: user?.currency || "INR",
  });

  const [password, setPassword] = useState({
    current:  "",
    newPass:  "",
    confirm:  "",
  });

  const [loadingProfile,  setLoadingProfile]  = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleLogout = async () => {
    try { await api.post("/auth/logout", { refreshToken: localStorage.getItem("refreshToken") }); } catch {}
    dispatch(logout());
    navigate("/login");
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profile.name) { toast.error("Name is required"); return; }
    setLoadingProfile(true);
    try {
      const res = await api.put("/auth/profile", profile);
      dispatch(setCredentials({
        user:         res.data.user,
        accessToken:  localStorage.getItem("accessToken"),
        refreshToken: localStorage.getItem("refreshToken"),
      }));
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (password.newPass !== password.confirm) {
      toast.error("Passwords do not match"); return;
    }
    if (password.newPass.length < 8) {
      toast.error("Password must be at least 8 characters"); return;
    }
    setLoadingPassword(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: password.current,
        newPassword:     password.newPass,
      });
      toast.success("Password changed successfully!");
      setPassword({ current: "", newPass: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoadingPassword(false);
    }
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", background: "#f8fafc" }}>

      <Sidebar onNavigate={(path) => navigate(path)} user={user} onLogout={handleLogout} />

      <div style={{ flex: 1, overflowY: "auto" }}>

        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 32px", position: "sticky", top: 0, zIndex: 10 }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Settings</h1>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Manage your account preferences</p>
        </div>

        <div style={{ padding: "28px 32px", maxWidth: 680 }}>

          {/* Profile Card */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px 28px", marginBottom: 20 }}>

            {/* Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 }}>
                {initials}
              </div>
              <div>
                <p style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>{user?.name}</p>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>{user?.email}</p>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "#dcfce7", color: "#16a34a" }}>
                  Verified ✓
                </span>
              </div>
            </div>

            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Profile Information</h3>

            <form onSubmit={handleProfileSave}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Full Name</label>
                  <input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Your full name"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Phone (optional)</label>
                  <input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Currency</label>
                <select
                  value={profile.currency}
                  onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                  style={{ ...inputStyle, width: "50%" }}
                >
                  <option value="INR">₹ INR — Indian Rupee</option>
                  <option value="USD">$ USD — US Dollar</option>
                  <option value="EUR">€ EUR — Euro</option>
                  <option value="GBP">£ GBP — British Pound</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Email Address</label>
                <input
                  value={user?.email || ""}
                  disabled
                  style={{ ...inputStyle, background: "#f1f5f9", color: "#94a3b8", cursor: "not-allowed" }}
                />
                <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0" }}>Email cannot be changed</p>
              </div>

              <button type="submit" disabled={loadingProfile}
                style={{ marginTop: 20, padding: "11px 28px", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: 10, fontSize: "14px", fontWeight: 700, cursor: "pointer", opacity: loadingProfile ? 0.7 : 1 }}>
                {loadingProfile ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </div>

          {/* Change Password Card */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px 28px", marginBottom: 20 }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Change Password</h3>

            <form onSubmit={handlePasswordSave}>
              {[
                { label: "Current Password",  key: "current", placeholder: "Enter current password" },
                { label: "New Password",      key: "newPass", placeholder: "Min 8 characters"        },
                { label: "Confirm Password",  key: "confirm", placeholder: "Repeat new password"     },
              ].map(({ label, key, placeholder }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{label}</label>
                  <input
                    type="password"
                    value={password[key]}
                    onChange={(e) => setPassword({ ...password, [key]: e.target.value })}
                    placeholder={placeholder}
                    style={inputStyle}
                  />
                </div>
              ))}

              <button type="submit" disabled={loadingPassword}
                style={{ marginTop: 6, padding: "11px 28px", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: 10, fontSize: "14px", fontWeight: 700, cursor: "pointer", opacity: loadingPassword ? 0.7 : 1 }}>
                {loadingPassword ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div style={{ background: "#fff", border: "1px solid #fca5a5", borderRadius: 16, padding: "24px 28px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#ef4444", margin: "0 0 8px" }}>Danger Zone</h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px" }}>
              Once you log out all sessions, you will need to log in again on all devices.
            </p>
            <button
              onClick={handleLogout}
              style={{ padding: "10px 24px", background: "#fee2e2", color: "#ef4444", border: "1.5px solid #fca5a5", borderRadius: 10, fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
              Logout All Sessions
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
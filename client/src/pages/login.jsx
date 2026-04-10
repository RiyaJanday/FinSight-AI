import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import api from "../services/api.js";
import { setCredentials } from "../store/authslice.js";

const inputStyle = {
  width: "100%", padding: "11px 14px", fontSize: "14px",
  border: "1.5px solid #e2e8f0", borderRadius: "10px",
  outline: "none", color: "#0f172a", background: "#f8fafc",
  boxSizing: "border-box",
};

const btnStyle = {
  width: "100%", padding: "12px",
  background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
  color: "#fff", border: "none", borderRadius: "10px",
  fontSize: "14px", fontWeight: 700, cursor: "pointer",
};

export default function Login() {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const [step, setStep]       = useState("credentials");
  const [form, setForm]       = useState({ email: "", password: "" });
  const [otp, setOtp]         = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer]     = useState(60);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const startTimer = () => {
    setTimer(60);
    const iv = setInterval(() => {
      setTimer((t) => { if (t <= 1) { clearInterval(iv); return 0; } return t - 1; });
    }, 1000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/login", form);
      toast.success("OTP sent to your email!");
      setStep("otp");
      startTimer();
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally { setLoading(false); }
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5)
      document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleOtpKey = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx - 1}`)?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { toast.error("Enter all 6 digits"); return; }
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-login-otp", {
        email: form.email, otp: code,
      });
      dispatch(setCredentials(res.data));
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    try {
      await api.post("/auth/resend-otp", { email: form.email, type: "login" });
      toast.success("OTP resent!");
      startTimer();
    } catch { toast.error("Failed to resend OTP"); }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Left panel ── */}
      <div style={{
        flex: 1, position: "relative", overflow: "hidden",
        background: "#0f172a", display: "none",
      }} className="left-panel">
        <img
          src="https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=1200&q=80"
          alt="bank"
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg,rgba(15,23,42,0.85),rgba(30,58,138,0.6))",
        }} />
        <div style={{ position: "absolute", bottom: "15%", left: "10%", right: "10%" }}>
          <h1 style={{ color: "#fff", fontSize: "clamp(22px,3vw,34px)", fontWeight: 700, margin: "0 0 12px" }}>
            Take Control of Your Finances
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", lineHeight: 1.7, margin: "0 0 32px" }}>
            Track expenses, manage budgets, and achieve your financial goals with AI-powered insights.
          </p>
          <div style={{ display: "flex", gap: 28 }}>
            {[["10K+","Users"],["₹50Cr+","Tracked"],["99.9%","Uptime"]].map(([v,l]) => (
              <div key={l}>
                <div style={{ color: "#60a5fa", fontSize: "20px", fontWeight: 700 }}>{v}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{
        width: "100%", maxWidth: "480px", margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "32px 24px", background: "#f8fafc",
      }}>
        <div style={{
          background: "#fff", borderRadius: "16px",
          padding: "40px 36px", width: "100%",
          border: "1px solid #e2e8f0",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, color: "#fff",
            }}>₹</div>
            <span style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b" }}>FinSight AI</span>
          </div>

          {step === "credentials" ? (
            <>
              <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
                Welcome Back
              </h2>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 28px" }}>
                Enter your credentials to access your account
              </p>

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Email
                  </label>
                  <input
                    name="email" type="email" required
                    placeholder="you@domain.com"
                    value={form.email} onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Password
                  </label>
                  <input
                    name="password" type="password" required
                    placeholder="••••••••"
                    value={form.password} onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div style={{ textAlign: "right", marginBottom: 24 }}>
                  <Link to="/forgot-password" style={{ fontSize: "12px", color: "#3b82f6" }}>
                    Forgot password?
                  </Link>
                </div>

                <button type="submit" disabled={loading} style={btnStyle}>
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <p style={{ textAlign: "center", fontSize: "13px", color: "#64748b", marginTop: 20 }}>
                Don't have an account?{" "}
                <Link to="/signup" style={{ color: "#3b82f6", fontWeight: 600 }}>Sign up</Link>
              </p>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
                Verify your identity
              </h2>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 4px" }}>
                We sent a 6-digit OTP to
              </p>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", margin: "0 0 28px" }}>
                {form.email}
              </p>

              <form onSubmit={handleVerify}>
                {/* OTP boxes */}
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
                  {otp.map((d, i) => (
                    <input
                      key={i} id={`otp-${i}`}
                      type="text" inputMode="numeric"
                      maxLength={1} value={d}
                      onChange={(e) => handleOtpChange(e.target.value, i)}
                      onKeyDown={(e) => handleOtpKey(e, i)}
                      style={{
                        width: 44, height: 52, textAlign: "center",
                        fontSize: "20px", fontWeight: 700,
                        border: `2px solid ${d ? "#3b82f6" : "#e2e8f0"}`,
                        borderRadius: 10, outline: "none",
                        color: "#0f172a", background: "#f8fafc",
                      }}
                    />
                  ))}
                </div>

                <button type="submit" disabled={loading} style={btnStyle}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </form>

              <p style={{ textAlign: "center", fontSize: "13px", color: "#64748b", marginTop: 20 }}>
                {timer > 0 ? (
                  <>Resend in <strong style={{ color: "#1e293b" }}>{timer}s</strong></>
                ) : (
                  <button onClick={handleResend}
                    style={{ background: "none", border: "none", color: "#3b82f6", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
                    Resend OTP
                  </button>
                )}
              </p>
              <p style={{ textAlign: "center", marginTop: 8 }}>
                <button onClick={() => { setStep("credentials"); setOtp(["","","","","",""]); }}
                  style={{ background: "none", border: "none", color: "#64748b", fontSize: "13px", cursor: "pointer" }}>
                  ← Change email
                </button>
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media(min-width:768px){ .left-panel{ display:block !important; } }
        input:focus { border-color: #3b82f6 !important; }
      `}</style>
    </div>
  );
}
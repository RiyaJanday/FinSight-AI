import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import api from "../services/api.js";
import { setCredentials } from "../store/authSlice.js";

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

export default function Signup() {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const [step, setStep]       = useState("form");
  const [form, setForm]       = useState({ name: "", email: "", password: "", confirm: "" });
  const [otp, setOtp]         = useState(["","","","","",""]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer]     = useState(60);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const startTimer = () => {
    setTimer(60);
    const iv = setInterval(() => {
      setTimer((t) => { if (t <= 1) { clearInterval(iv); return 0; } return t - 1; });
    }, 1000);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error("Passwords do not match"); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: form.name, email: form.email, password: form.password,
      });
      toast.success("OTP sent to your email!");
      setStep("otp");
      startTimer();
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < 5) document.getElementById(`sotp-${idx + 1}`)?.focus();
  };

  const handleOtpKey = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      document.getElementById(`sotp-${idx - 1}`)?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { toast.error("Enter all 6 digits"); return; }
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-register-otp", {
        email: form.email, otp: code,
      });
      dispatch(setCredentials(res.data));
      toast.success("Account created! Welcome to FinSight AI!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    try {
      await api.post("/auth/resend-otp", { email: form.email, type: "register" });
      toast.success("OTP resent!"); startTimer();
    } catch { toast.error("Failed to resend"); }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{
        flex: 1, position: "relative", overflow: "hidden",
        background: "#0f172a", display: "none",
      }} className="left-panel">
        <img
          src="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80"
          alt="finance"
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(15,23,42,0.85),rgba(30,58,138,0.6))" }} />
        <div style={{ position: "absolute", bottom: "15%", left: "10%", right: "10%" }}>
          <h1 style={{ color: "#fff", fontSize: "clamp(22px,3vw,34px)", fontWeight: 700, margin: "0 0 12px" }}>
            Start Your Financial Journey
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", lineHeight: 1.7 }}>
            Join thousands of users who track smarter, save better, and achieve their financial goals.
          </p>
        </div>
      </div>

      <div style={{
        width: "100%", maxWidth: "480px", margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "32px 24px", background: "#f8fafc",
      }}>
        <div style={{ background: "#fff", borderRadius: "16px", padding: "40px 36px", width: "100%", border: "1px solid #e2e8f0" }}>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff" }}>₹</div>
            <span style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b" }}>FinSight AI</span>
          </div>

          {step === "form" ? (
            <>
              <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>Create Account</h2>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 24px" }}>Start managing your finances smarter</p>

              <form onSubmit={handleSignup}>
                {[
                  { label: "Full Name", name: "name", type: "text", placeholder: "Your Name here" },
                  { label: "Email", name: "email", type: "email", placeholder: "you@domain.com" },
                  { label: "Password", name: "password", type: "password", placeholder: "Min 8 characters" },
                  { label: "Confirm Password", name: "confirm", type: "password", placeholder: "Repeat password" },
                ].map(({ label, name, type, placeholder }) => (
                  <div key={name} style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{label}</label>
                    <input name={name} type={type} required placeholder={placeholder} value={form[name]} onChange={handleChange} style={inputStyle} />
                  </div>
                ))}

                <button type="submit" disabled={loading} style={{ ...btnStyle, marginTop: 8 }}>
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>

              <p style={{ textAlign: "center", fontSize: "13px", color: "#64748b", marginTop: 20 }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: "#3b82f6", fontWeight: 600 }}>Sign in</Link>
              </p>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>Verify your email</h2>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 4px" }}>We sent a 6-digit OTP to</p>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b", margin: "0 0 28px" }}>{form.email}</p>

              <form onSubmit={handleVerify}>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
                  {otp.map((d, i) => (
                    <input key={i} id={`sotp-${i}`} type="text" inputMode="numeric"
                      maxLength={1} value={d}
                      onChange={(e) => handleOtpChange(e.target.value, i)}
                      onKeyDown={(e) => handleOtpKey(e, i)}
                      style={{ width: 44, height: 52, textAlign: "center", fontSize: "20px", fontWeight: 700, border: `2px solid ${d ? "#3b82f6" : "#e2e8f0"}`, borderRadius: 10, outline: "none", color: "#0f172a", background: "#f8fafc" }}
                    />
                  ))}
                </div>
                <button type="submit" disabled={loading} style={btnStyle}>
                  {loading ? "Verifying..." : "Verify & Continue"}
                </button>
              </form>

              <p style={{ textAlign: "center", fontSize: "13px", color: "#64748b", marginTop: 20 }}>
                {timer > 0 ? <>Resend in <strong style={{ color: "#1e293b" }}>{timer}s</strong></> : (
                  <button onClick={handleResend} style={{ background: "none", border: "none", color: "#3b82f6", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>Resend OTP</button>
                )}
              </p>
              <p style={{ textAlign: "center", marginTop: 8 }}>
                <button onClick={() => { setStep("form"); setOtp(["","","","","",""]); }}
                  style={{ background: "none", border: "none", color: "#64748b", fontSize: "13px", cursor: "pointer" }}>
                  ← Go back
                </button>
              </p>
            </>
          )}
        </div>
      </div>
      <style>{`@media(min-width:768px){ .left-panel{ display:block !important; } } input:focus { border-color: #3b82f6 !important; }`}</style>
    </div>
  );
}
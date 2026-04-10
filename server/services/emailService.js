import { sendMail } from "../config/nodemailer.js";

// ── OTP email template ────────────────────────────────────────
const otpTemplate = (otp, type) => {
  const titles = {
    register:      "Verify your FinSight AI account",
    login:         "Your FinSight AI login OTP",
    reset_password: "Reset your FinSight AI password",
  };

  const messages = {
    register:      "Thank you for registering! Use the OTP below to verify your account.",
    login:         "Use the OTP below to complete your login.",
    reset_password: "Use the OTP below to reset your password.",
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    </head>
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
        <tr>
          <td align="center">
            <table width="520" cellpadding="0" cellspacing="0"
              style="background:#ffffff;border-radius:16px;overflow:hidden;
                     box-shadow:0 4px 24px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);
                            padding:32px 40px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;
                              letter-spacing:-0.5px;">
                    FinSight AI
                  </h1>
                  <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">
                    Personal Finance Manager
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <h2 style="color:#0f172a;font-size:20px;font-weight:600;margin:0 0 12px;">
                    ${titles[type]}
                  </h2>
                  <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 32px;">
                    ${messages[type]}
                  </p>

                  <!-- OTP Box -->
                  <div style="background:#f8fafc;border:2px dashed #3b82f6;
                              border-radius:12px;padding:24px;text-align:center;
                              margin-bottom:32px;">
                    <p style="color:#64748b;font-size:12px;font-weight:600;
                               text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">
                      Your One-Time Password
                    </p>
                    <p style="color:#1d4ed8;font-size:42px;font-weight:800;
                               letter-spacing:12px;margin:0;font-family:monospace;">
                      ${otp}
                    </p>
                    <p style="color:#94a3b8;font-size:12px;margin:12px 0 0;">
                      Valid for ${process.env.OTP_EXPIRES_MINUTES || 10} minutes only
                    </p>
                  </div>

                  <!-- Warning -->
                  <div style="background:#fef3c7;border-radius:8px;
                              padding:12px 16px;margin-bottom:24px;">
                    <p style="color:#92400e;font-size:13px;margin:0;">
                      ⚠ Never share this OTP with anyone.
                      FinSight AI will never ask for your OTP.
                    </p>
                  </div>

                  <p style="color:#94a3b8;font-size:13px;margin:0;">
                    If you didn't request this, you can safely ignore this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc;padding:20px 40px;
                            border-top:1px solid #e2e8f0;text-align:center;">
                  <p style="color:#94a3b8;font-size:12px;margin:0;">
                    © 2024 FinSight AI · All rights reserved
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// ── Send OTP Email ────────────────────────────────────────────
export const sendOTPEmail = async (email, otp, type) => {
  const subjects = {
    register:       "Verify your FinSight AI account",
    login:          "Your FinSight AI login OTP",
    reset_password: "Reset your FinSight AI password",
  };

  await sendMail({
    to: email,
    subject: subjects[type],
    html: otpTemplate(otp, type),
  });

  console.log(`📧 OTP email sent to ${email} [type: ${type}]`);
};

// ── Send Budget Alert Email ───────────────────────────────────
export const sendBudgetAlertEmail = async (email, category, percent) => {
  const html = `
    <div style="font-family:sans-serif;padding:24px;">
      <h2 style="color:#ef4444;">Budget Alert — ${category}</h2>
      <p>You have used <strong>${percent}%</strong> of your
         <strong>${category}</strong> budget this month.</p>
      <p>Log in to FinSight AI to review your spending.</p>
    </div>
  `;

  await sendMail({
    to: email,
    subject: `⚠ Budget Alert: ${category} at ${percent}%`,
    html,
  });
};
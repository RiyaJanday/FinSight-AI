import nodemailer from "nodemailer";

let transporter;

export const verifyMailer = async () => {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.log("⚠ Gmail skipped — no credentials");
      return;
    }

    transporter = nodemailer.createTransport({
      host:   "smtp.gmail.com",
      port:   465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.verify();
    console.log("✅ Gmail transporter ready");
  } catch (err) {
    console.log("⚠ Gmail skipped —", err.message);
    transporter = null;
  }
};

export const sendMail = async ({ to, subject, html }) => {
  if (!transporter) {
    // Fallback — print to logs
    console.log("📧 [MAIL FALLBACK - CHECK RAILWAY LOGS]");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    return;
  }

  try {
    await transporter.sendMail({
      from:    `"FinSight AI" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
    // Don't throw — app continues even if email fails
  }
};
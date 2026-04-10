import nodemailer from "nodemailer";

let transporter;

export const verifyMailer = async () => {
  try {
    // Skip if credentials not set
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.log("⚠ Gmail skipped — no credentials set");
      return;
    }

    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
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
    // During development — just log OTP to console instead
    console.log("📧 [DEV MAIL SKIPPED]");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Body:", html);
    return;
  }

  await transporter.sendMail({
    from: `"FinSight AI" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
};
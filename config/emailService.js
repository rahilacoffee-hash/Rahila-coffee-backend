import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function sendEmail(to, subject, text, html) {
  try {
    // ✅ verify connection
    await transporter.verify();
    console.log("✅ Email server ready");

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER, // ✅ FIXED
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Email sent:", info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return { success: false, error: error.message };
  }
}

export { sendEmail };
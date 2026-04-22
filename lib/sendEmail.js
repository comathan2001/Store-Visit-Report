import nodemailer from "nodemailer";

const hasSmtpConfig = () =>
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS &&
  process.env.EMAIL_FROM &&
  process.env.EMAIL_TO;

const buildIssuesHtml = (issues) => {
  if (!issues.length) {
    return "<li>No issues recorded.</li>";
  }

  return issues
    .map(
      (issue) =>
        `<li><strong>${issue.description || "No description"}</strong> - ${issue.status} - Due: ${
          issue.dueDate || "N/A"
        }</li>`
    )
    .join("");
};

export const sendReportEmail = async (report) => {
  if (!hasSmtpConfig()) {
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
    subject: `Store Visit Report: ${report.storeName} (${report.visitDate})`,
    html: `
      <h2>Store Visit Report Synced</h2>
      <p><strong>Store Name:</strong> ${report.storeName}</p>
      <p><strong>Sales Rep:</strong> ${report.salesRepName}</p>
      <p><strong>Date:</strong> ${report.visitDate}</p>
      <p><strong>Issues:</strong></p>
      <ul>${buildIssuesHtml(report.issues)}</ul>
    `
  });
};

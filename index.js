import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { ensureDataFile, getAllReports, saveReports } from "./lib/reportStore.js";
import { sendReportEmail } from "./lib/sendEmail.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(projectRoot));

await ensureDataFile();

const withIssueIds = (issues = []) =>
  issues.map((issue) => ({
    ...issue,
    id: issue.id || crypto.randomUUID(),
    status: issue.status || "Open"
  }));

const normalizeReport = (report) => ({
  ...report,
  id: report.id || crypto.randomUUID(),
  createdAt: report.createdAt || new Date().toISOString(),
  issues: withIssueIds(report.issues),
  competitorItems: Array.isArray(report.competitorItems) ? report.competitorItems : []
});

const persistReports = async (incomingReports) => {
  const storedReports = await getAllReports();
  const existingIds = new Set(storedReports.map((report) => report.id));
  const newReports = incomingReports.map(normalizeReport).filter((report) => !existingIds.has(report.id));

  if (newReports.length === 0) {
    return { inserted: [], duplicates: incomingReports.map((report) => report.id) };
  }

  await saveReports([...newReports, ...storedReports]);

  for (const report of newReports) {
    await sendReportEmail(report);
  }

  return {
    inserted: newReports.map((report) => report.id),
    duplicates: incomingReports.filter((report) => existingIds.has(report.id)).map((report) => report.id)
  };
};

app.get("/api/health", (_, response) => {
  response.json({ ok: true });
});

app.get("/api/reports", async (_, response) => {
  const reports = await getAllReports();
  response.json({ reports });
});

app.post("/api/reports", async (request, response) => {
  try {
    const result = await persistReports([request.body]);
    response.status(201).json(result);
  } catch (error) {
    response.status(500).json({ error: error.message || "Failed to save report" });
  }
});

app.post("/api/sync-reports", async (request, response) => {
  try {
    const reports = Array.isArray(request.body.reports) ? request.body.reports : [];
    const result = await persistReports(reports);
    response.json(result);
  } catch (error) {
    response.status(500).json({ error: error.message || "Failed to sync reports" });
  }
});

app.patch("/api/reports/:reportId/issues/:issueId", async (request, response) => {
  try {
    const { reportId, issueId } = request.params;
    const { status } = request.body;

    if (!["Open", "In Progress", "Resolved"].includes(status)) {
      response.status(400).json({ error: "Invalid status" });
      return;
    }

    const reports = await getAllReports();
    const reportIndex = reports.findIndex((report) => report.id === reportId);

    if (reportIndex < 0) {
      response.status(404).json({ error: "Report not found" });
      return;
    }

    const issueIndex = reports[reportIndex].issues.findIndex((issue) => issue.id === issueId);

    if (issueIndex < 0) {
      response.status(404).json({ error: "Issue not found" });
      return;
    }

    reports[reportIndex].issues[issueIndex].status = status;
    reports[reportIndex].updatedAt = new Date().toISOString();

    await saveReports(reports);

    response.json({ ok: true, report: reports[reportIndex] });
  } catch (error) {
    response.status(500).json({ error: error.message || "Failed to update issue status" });
  }
});

app.get("*", (_, response) => {
  response.sendFile(path.join(projectRoot, "index.html"));
});

app.listen(port, () => {
  console.log(`Store Visit Report API running on http://localhost:${port}`);
});

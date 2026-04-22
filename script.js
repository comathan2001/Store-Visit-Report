const CACHE_KEY = "storeVisitAuditReportsCache";
const PENDING_ACTIONS_KEY = "storeVisitPendingActions";
const ISSUE_STATUSES = ["Open", "In Progress", "Resolved"];
const AUDIT_STATUS_OPTIONS = ["Yes", "No", "N/A"];
const today = new Date().toISOString().split("T")[0];

const auditSections = [
  {
    title: "1. Store Environment",
    items: [
      "Store is clean and organized",
      "Displays are neat, stocked, and complete (incl. tools)",
      "Wall and island modules are stable, organized, and neat",
      "Hangtags (price tags, product info) are visible, correct, and properly attached",
      "Red Tag Sale signage is visible and properly displayed",
      "Display space is maximized",
      "All displayed items are in good condition (no damage, stains, or defects)",
      "All items with bulbs have working and properly installed bulbs"
    ]
  },
  {
    title: "2. Staff & Customer Service",
    items: [
      "Promodisers are properly groomed and in correct uniform (clean and neat)",
      "Promodisers are actively assisting customers",
      "Promodisers are knowledgable of the items",
      "Customer complaints or issues addressed"
    ]
  },
  {
    title: "3. Inventory",
    items: [
      "Stocks are complete, fast moving items are reordered",
      "Stockroom is organized (if applicable)",
      "All defective items reported and documented"
    ]
  }
];

const form = document.getElementById("reportForm");
const visitDateInput = document.getElementById("visitDate");
const auditChecklist = document.getElementById("auditChecklist");
const issuesContainer = document.getElementById("issuesContainer");
const competitorsContainer = document.getElementById("competitorsContainer");
const reportsList = document.getElementById("reportsList");
const reportCount = document.getElementById("reportCount");
const saveStatus = document.getElementById("saveStatus");
const addIssueButton = document.getElementById("addIssueButton");
const addCompetitorButton = document.getElementById("addCompetitorButton");
const clearAllButton = document.getElementById("clearAllButton");
const issueTemplate = document.getElementById("issueTemplate");
const competitorTemplate = document.getElementById("competitorTemplate");
const heroChip = document.querySelector(".hero-chip");

visitDateInput.value = today;
let reportsState = [];

function readCachedReports() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeCachedReports(reports) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(reports));
}

function readPendingActions() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_ACTIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writePendingActions(actions) {
  localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(actions));
}

function queuePendingAction(action) {
  const actions = readPendingActions();
  actions.push(action);
  writePendingActions(actions);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isOverdue(issue) {
  if (!issue.dueDate || issue.status === "Resolved") {
    return false;
  }

  return issue.dueDate < today;
}

function autoResizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

function wireAutosize(scope = document) {
  scope.querySelectorAll("textarea").forEach((textarea) => {
    autoResizeTextarea(textarea);
    textarea.removeEventListener("input", handleTextareaInput);
    textarea.addEventListener("input", handleTextareaInput);
  });
}

function handleTextareaInput(event) {
  autoResizeTextarea(event.target);
}

function renderAuditChecklist() {
  auditChecklist.innerHTML = auditSections
    .map(
      (section, sectionIndex) => `
        <section class="audit-section">
          <h4>${escapeHtml(section.title)}</h4>
          <div class="audit-items">
            ${section.items
              .map(
                (item, itemIndex) => `
                  <article class="audit-item">
                    <div class="audit-item-copy">
                      <strong>${escapeHtml(item)}</strong>
                    </div>
                    <label>
                      Result
                      <select name="audit_${sectionIndex}_${itemIndex}_status">
                        ${AUDIT_STATUS_OPTIONS.map((option) => `<option value="${option}">${option}</option>`).join("")}
                      </select>
                    </label>
                    <label class="full-span">
                      Remarks / Notes / Actions Taken
                      <textarea name="audit_${sectionIndex}_${itemIndex}_remarks" rows="2"></textarea>
                    </label>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>
      `
    )
    .join("");

  wireAutosize(auditChecklist);
}

function createDynamicEditor(container, template, item = {}) {
  const fragment = template.content.cloneNode(true);
  const editor = fragment.querySelector(".issue-editor");

  editor.querySelectorAll("[data-field]").forEach((field) => {
    field.value = item[field.dataset.field] || (field.dataset.field === "status" ? "Open" : "");
  });

  editor.querySelector(".remove-item-button").addEventListener("click", () => {
    const editors = container.querySelectorAll(".issue-editor");
    if (editors.length === 1) {
      editor.querySelectorAll("[data-field]").forEach((field) => {
        field.value = field.dataset.field === "status" ? "Open" : "";
      });
      return;
    }

    editor.remove();
  });

  container.appendChild(fragment);
  wireAutosize(editor);
}

function collectDynamicItems(container) {
  return Array.from(container.querySelectorAll(".issue-editor"))
    .map((editor) => {
      const item = {};
      editor.querySelectorAll("[data-field]").forEach((field) => {
        item[field.dataset.field] = field.value.trim();
      });
      if (!item.id) {
        item.id = crypto.randomUUID();
      }
      return item;
    })
    .filter((item) => Object.entries(item).some(([key, value]) => key !== "id" && value !== ""));
}

function collectAuditResults(formData) {
  return auditSections.map((section, sectionIndex) => ({
    title: section.title,
    items: section.items.map((label, itemIndex) => ({
      label,
      status: formData.get(`audit_${sectionIndex}_${itemIndex}_status`),
      remarks: (formData.get(`audit_${sectionIndex}_${itemIndex}_remarks`) || "").trim()
    }))
  }));
}

function buildReportPayload() {
  const formData = new FormData(form);

  return {
    id: crypto.randomUUID(),
    branch: (formData.get("branch") || "").trim(),
    visitDate: formData.get("visitDate"),
    salesRepName: (formData.get("salesRepName") || "").trim(),
    promodisersPresent: (formData.get("promodisersPresent") || "").trim(),
    timeIn: formData.get("timeIn"),
    timeOut: formData.get("timeOut"),
    rovingCoordinator: (formData.get("rovingCoordinator") || "").trim(),
    runningSales: (formData.get("runningSales") || "").trim(),
    auditResults: collectAuditResults(formData),
    findings: {
      issuesFound: (formData.get("issuesFound") || "").trim(),
      actionNeeded: (formData.get("actionNeeded") || "").trim(),
      followUpRequired: formData.get("followUpRequired"),
      targetResolutionDate: formData.get("targetResolutionDate"),
      additionalRecommendations: (formData.get("additionalRecommendations") || "").trim()
    },
    competitorItems: collectDynamicItems(competitorsContainer),
    competitorObservations: (formData.get("competitorObservations") || "").trim(),
    issues: collectDynamicItems(issuesContainer),
    photoReferences: (formData.get("photoReferences") || "").trim(),
    additionalNotes: (formData.get("additionalNotes") || "").trim(),
    createdAt: new Date().toISOString()
  };
}

function createStatusChip(status) {
  const safeClass = status.toLowerCase().replace(/\s+/g, "-");
  return `<span class="status-chip status-${safeClass}">${escapeHtml(status)}</span>`;
}

function setConnectionStatus(mode) {
  const pendingCount = readPendingActions().length;

  if (!navigator.onLine) {
    heroChip.textContent = "Offline Queue Active";
    saveStatus.textContent = "Offline mode";
    return;
  }

  if (pendingCount > 0) {
    heroChip.textContent = `Sync Pending (${pendingCount})`;
    return;
  }

  heroChip.textContent = mode || "Team Sync Enabled";
}

function auditSummaryHtml(report) {
  const markedItems = report.auditResults.flatMap((section) =>
    section.items
      .filter((item) => item.status === "Yes")
      .map((item) => `<span class="audit-pill">${escapeHtml(item.label)}</span>`)
  );

  return markedItems.length ? markedItems.join("") : '<span class="audit-pill">No audit items marked Yes</span>';
}

function renderCompetitorItems(items) {
  if (!items.length) {
    return '<div class="empty-state small-empty">No competitor items recorded.</div>';
  }

  return items
    .map(
      (item) => `
        <article class="issue-item">
          <div class="issue-item-header">
            <h4>${escapeHtml(item.brand || "Competitor")}</h4>
            <span class="status-chip status-in-progress">${escapeHtml(item.price || "No Price")}</span>
          </div>
          <div class="issue-row">
            <span><strong>Item:</strong> ${escapeHtml(item.itemName || "-")}</span>
            <span><strong>Category:</strong> ${escapeHtml(item.category || "-")}</span>
            <span><strong>Type:</strong> ${escapeHtml(item.type || "-")}</span>
            <span><strong>Picture:</strong> ${escapeHtml(item.picture || "-")}</span>
            <span><strong>Notes:</strong> ${escapeHtml(item.otherNotes || "-")}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderIssues(report) {
  if (!report.issues.length) {
    return '<div class="empty-state small-empty">No issues recorded.</div>';
  }

  return report.issues
    .map(
      (issue, issueIndex) => `
        <article class="issue-item ${isOverdue(issue) ? "overdue" : ""}">
          <div class="issue-item-header">
            <h4>${escapeHtml(issue.description || "Untitled issue")}</h4>
            ${createStatusChip(issue.status)}
          </div>
          <div class="issue-row">
            <span><strong>Action Plan:</strong> ${escapeHtml(issue.actionPlan || "-")}</span>
            <span><strong>Assigned To:</strong> ${escapeHtml(issue.assignedTo || "-")}</span>
            <span><strong>Due Date:</strong> ${escapeHtml(issue.dueDate || "-")}</span>
            ${isOverdue(issue) ? '<span><strong>Alert:</strong> This issue is overdue.</span>' : ""}
          </div>
          <label class="status-update">
            Update Status
            <select data-report-id="${report.id}" data-issue-id="${issue.id}" data-issue-index="${issueIndex}" class="issue-status-select">
              ${ISSUE_STATUSES.map(
                (status) => `<option value="${status}" ${status === issue.status ? "selected" : ""}>${status}</option>`
              ).join("")}
            </select>
          </label>
        </article>
      `
    )
    .join("");
}

function renderReports() {
  const reports = [...reportsState].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  reportCount.textContent = `${reports.length} Report${reports.length === 1 ? "" : "s"}`;

  if (!reports.length) {
    reportsList.innerHTML = '<div class="empty-state">No saved reports yet.</div>';
    return;
  }

  reportsList.innerHTML = reports
    .map((report) => {
      const hasOverdue = report.issues.some(isOverdue);

      return `
        <article class="report-card ${hasOverdue ? "overdue" : ""}">
          <div class="report-header">
            <div>
              <h3>${escapeHtml(report.branch)}</h3>
              <div class="meta-row">
                <span>${escapeHtml(report.salesRepName)}</span>
                <span>${escapeHtml(report.visitDate)}</span>
                <span>${escapeHtml(report.timeIn || "-")} to ${escapeHtml(report.timeOut || "-")}</span>
              </div>
            </div>
            ${hasOverdue ? '<span class="status-chip status-open">Overdue Issue</span>' : '<span class="status-chip status-resolved">Saved</span>'}
          </div>

          <div class="report-content">
            <section class="report-section">
              <h4>Visit Details</h4>
              <div class="meta-row">
                <span>Promodisers: ${escapeHtml(report.promodisersPresent || "-")}</span>
                <span>Coordinator: ${escapeHtml(report.rovingCoordinator || "-")}</span>
                <span>Running Sales: ${escapeHtml(report.runningSales || "0")}</span>
                <span>Follow-Up: ${escapeHtml(report.findings.followUpRequired || "No")}</span>
              </div>
            </section>

            <section class="report-section">
              <h4>Audit Summary</h4>
              <div class="audit-summary">${auditSummaryHtml(report)}</div>
            </section>

            <section class="report-section">
              <h4>Findings & Follow-Up</h4>
              <div class="issue-row">
                <span><strong>Issues Found:</strong> ${escapeHtml(report.findings.issuesFound || "-")}</span>
                <span><strong>Action Needed:</strong> ${escapeHtml(report.findings.actionNeeded || "-")}</span>
                <span><strong>Target Resolution:</strong> ${escapeHtml(report.findings.targetResolutionDate || "-")}</span>
                <span><strong>Recommendations:</strong> ${escapeHtml(report.findings.additionalRecommendations || "-")}</span>
              </div>
            </section>

            <section class="report-section">
              <h4>Competitor Analysis</h4>
              <div class="report-issues">${renderCompetitorItems(report.competitorItems)}</div>
              <p>${escapeHtml(report.competitorObservations || "No competitor observations")}</p>
            </section>

            <section class="report-section">
              <h4>Issue Tracker</h4>
              <div class="report-issues">${renderIssues(report)}</div>
            </section>

            <section class="report-section">
              <h4>Photo References</h4>
              <p>${escapeHtml(report.photoReferences || "No photo references")}</p>
            </section>

            <section class="report-section">
              <h4>Additional Notes</h4>
              <p>${escapeHtml(report.additionalNotes || "No additional notes")}</p>
            </section>
          </div>
        </article>
      `;
    })
    .join("");

  reportsList.querySelectorAll(".issue-status-select").forEach((select) => {
    select.addEventListener("change", handleStatusChange);
  });
}

function handleStatusChange(event) {
  const reportId = event.target.dataset.reportId;
  const issueId = event.target.dataset.issueId;
  const newStatus = event.target.value;
  const report = reportsState.find((item) => item.id === reportId);

  if (!report) {
    return;
  }

  const issue = report.issues.find((item) => item.id === issueId);

  if (!issue) {
    return;
  }

  issue.status = newStatus;
  writeCachedReports(reportsState);
  saveStatus.textContent = navigator.onLine ? "Syncing issue status..." : "Issue update queued";
  renderReports();

  syncIssueStatus(reportId, issueId, newStatus);
}

async function fetchReportsFromServer() {
  const response = await fetch("/api/reports");

  if (!response.ok) {
    throw new Error("Failed to load shared reports");
  }

  const payload = await response.json();
  return Array.isArray(payload.reports) ? payload.reports : [];
}

async function createReportOnServer(report) {
  const response = await fetch("/api/reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(report)
  });

  if (!response.ok) {
    throw new Error("Failed to save report");
  }
}

async function pushIssueStatusToServer(reportId, issueId, status) {
  const response = await fetch(`/api/reports/${reportId}/issues/${issueId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    throw new Error("Failed to update issue status");
  }
}

async function syncIssueStatus(reportId, issueId, status) {
  try {
    if (!navigator.onLine) {
      throw new Error("Offline");
    }

    await pushIssueStatusToServer(reportId, issueId, status);
    saveStatus.textContent = "Issue status synced";
    setConnectionStatus();
  } catch {
    queuePendingAction({ type: "issueStatus", reportId, issueId, status });
    setConnectionStatus();
  }
}

async function syncPendingActions() {
  const actions = readPendingActions();

  if (!navigator.onLine || actions.length === 0) {
    setConnectionStatus();
    return;
  }

  const remaining = [];

  for (const action of actions) {
    try {
      if (action.type === "createReport") {
        await createReportOnServer(action.report);
      } else if (action.type === "issueStatus") {
        await pushIssueStatusToServer(action.reportId, action.issueId, action.status);
      }
    } catch {
      remaining.push(action);
    }
  }

  writePendingActions(remaining);
  setConnectionStatus(remaining.length ? `Sync Pending (${remaining.length})` : "Team Sync Enabled");
}

async function loadReports() {
  try {
    await syncPendingActions();

    if (!navigator.onLine) {
      reportsState = readCachedReports();
      renderReports();
      setConnectionStatus();
      return;
    }

    reportsState = await fetchReportsFromServer();
    writeCachedReports(reportsState);
    renderReports();
    setConnectionStatus("Team Sync Enabled");
  } catch {
    reportsState = readCachedReports();
    renderReports();
    setConnectionStatus();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const report = buildReportPayload();
  reportsState = [report, ...reportsState];
  writeCachedReports(reportsState);
  saveStatus.textContent = navigator.onLine ? "Saving to team workspace..." : "Saved locally. Sync queued.";
  renderReports();

  form.reset();
  visitDateInput.value = today;
  issuesContainer.innerHTML = "";
  competitorsContainer.innerHTML = "";
  createDynamicEditor(issuesContainer, issueTemplate);
  createDynamicEditor(competitorsContainer, competitorTemplate);
  wireAutosize(form);

  if (navigator.onLine) {
    createReportOnServer(report)
      .then(() => {
        saveStatus.textContent = "Report synced for the team";
        loadReports();
      })
      .catch(() => {
        queuePendingAction({ type: "createReport", report });
        saveStatus.textContent = "Saved locally. Sync queued.";
        setConnectionStatus();
      });
  } else {
    queuePendingAction({ type: "createReport", report });
    setConnectionStatus();
  }
});

addIssueButton.addEventListener("click", () => createDynamicEditor(issuesContainer, issueTemplate));
addCompetitorButton.addEventListener("click", () => createDynamicEditor(competitorsContainer, competitorTemplate));

clearAllButton.addEventListener("click", () => {
  const confirmed = window.confirm("Delete all saved reports from this device?");
  if (!confirmed) {
    return;
  }

  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(PENDING_ACTIONS_KEY);
  reportsState = [];
  saveStatus.textContent = "Local cache cleared";
  renderReports();
  setConnectionStatus();
});

window.addEventListener("online", loadReports);
window.addEventListener("offline", () => setConnectionStatus());
window.setInterval(() => {
  if (navigator.onLine) {
    loadReports();
  }
}, 15000);

renderAuditChecklist();
createDynamicEditor(issuesContainer, issueTemplate);
createDynamicEditor(competitorsContainer, competitorTemplate);
wireAutosize(form);
loadReports();

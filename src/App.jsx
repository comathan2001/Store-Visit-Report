import React from "react";
import { v4 as uuidv4 } from "uuid";
import { createReportRequest, fetchReportsRequest, syncReportsRequest } from "./api";
import { Dashboard } from "./components/Dashboard";
import { OfflineBanner } from "./components/OfflineBanner";
import { ReportForm } from "./components/ReportForm";
import { getReports, getSyncQueue, queuePendingReport, removeQueuedReport, saveReports, upsertReport } from "./storage";

const buildReportPayload = (form, syncStatus) => ({
  id: uuidv4(),
  storeName: form.storeName.trim(),
  visitDate: form.visitDate,
  salesRepName: form.salesRepName.trim(),
  rovingCoordinator: form.rovingCoordinator.trim(),
  promodisersPresent: form.promodisersPresent.trim(),
  runningSales: form.runningSales === "" ? 0 : Number(form.runningSales),
  observations: { ...form.observations },
  issues: form.issues.map((issue) => ({
    description: issue.description.trim(),
    actionPlan: issue.actionPlan.trim(),
    assignedTo: issue.assignedTo.trim(),
    dueDate: issue.dueDate,
    status: issue.status || "Open"
  })),
  notes: form.notes.trim(),
  syncStatus,
  createdAt: new Date().toISOString()
});

const matchesFilters = (report, filters) => {
  if (filters.storeName && !report.storeName.toLowerCase().includes(filters.storeName.toLowerCase())) {
    return false;
  }

  if (filters.dateFrom && report.visitDate < filters.dateFrom) {
    return false;
  }

  if (filters.dateTo && report.visitDate > filters.dateTo) {
    return false;
  }

  if (filters.issueStatus && !report.issues.some((issue) => issue.status === filters.issueStatus)) {
    return false;
  }

  if (filters.syncStatus && report.syncStatus !== filters.syncStatus) {
    return false;
  }

  return true;
};

export default function App() {
  const [reports, setReports] = React.useState([]);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [saveMessage, setSaveMessage] = React.useState("");
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [filters, setFilters] = React.useState({
    storeName: "",
    dateFrom: "",
    dateTo: "",
    issueStatus: "",
    syncStatus: ""
  });

  const loadLocalReports = React.useCallback(async () => {
    const localReports = await getReports();

    if (!navigator.onLine) {
      setReports(localReports);
      return;
    }

    try {
      const { reports: remoteReports = [] } = await fetchReportsRequest();
      const mergedMap = new Map();

      [...remoteReports, ...localReports].forEach((report) => {
        const existing = mergedMap.get(report.id);

        if (!existing || report.syncStatus === "pending") {
          mergedMap.set(report.id, report);
        }
      });

      const mergedReports = Array.from(mergedMap.values()).sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );

      await saveReports(mergedReports);
      setReports(mergedReports);
    } catch {
      setReports(localReports);
    }
  }, []);

  React.useEffect(() => {
    loadLocalReports();
  }, [loadLocalReports]);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const syncPendingReports = React.useCallback(async () => {
    if (!navigator.onLine || isSyncing) {
      return;
    }

    setIsSyncing(true);

    try {
      const queue = await getSyncQueue();
      if (queue.length === 0) {
        setSaveMessage("All reports are already synced.");
        return;
      }

      const currentReports = await getReports();
      const pendingReports = currentReports.filter((report) => queue.includes(report.id));

      if (pendingReports.length === 0) {
        setSaveMessage("Pending queue cleared.");
        return;
      }

      await syncReportsRequest(pendingReports);

      for (const report of pendingReports) {
        await upsertReport({ ...report, syncStatus: "synced" });
        await removeQueuedReport(report.id);
      }

      await loadLocalReports();
      setSaveMessage(`Synced ${pendingReports.length} pending report${pendingReports.length > 1 ? "s" : ""}.`);
    } catch (error) {
      setSaveMessage(error.message || "Sync failed.");
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, loadLocalReports]);

  React.useEffect(() => {
    if (isOnline) {
      syncPendingReports();
    }
  }, [isOnline, syncPendingReports]);

  const handleSubmit = async (form) => {
    if (!form.storeName || !form.salesRepName || !form.visitDate) {
      setSaveMessage("Store name, visit date, and sales rep are required.");
      return false;
    }

    const report = buildReportPayload(form, isOnline ? "synced" : "pending");

    if (isOnline) {
      try {
        await createReportRequest(report);
        await upsertReport(report);
        setSaveMessage("Report saved and synced.");
      } catch (error) {
        const offlineReport = { ...report, syncStatus: "pending" };
        await upsertReport(offlineReport);
        await queuePendingReport(offlineReport.id);
        setSaveMessage("Network save failed. Report stored offline and queued.");
      }
    } else {
      await upsertReport(report);
      await queuePendingReport(report.id);
      setSaveMessage("Saved offline. Pending sync.");
    }

    await loadLocalReports();
    return true;
  };

  const filteredReports = reports.filter((report) => matchesFilters(report, filters));
  const pendingCount = reports.filter((report) => report.syncStatus === "pending").length;

  return (
    <div className="app-shell">
      <OfflineBanner isOnline={isOnline} />

      <header className="hero">
        <div>
          <p className="eyebrow">Store Operations</p>
          <h1>Store Visit Report System</h1>
          <p className="hero-copy">
            Capture visits on the floor, keep working offline, and sync cleanly when the connection returns.
          </p>
        </div>

        <div className="hero-metrics">
          <div className="metric-card">
            <span>Total Reports</span>
            <strong>{reports.length}</strong>
          </div>
          <div className="metric-card">
            <span>Pending Sync</span>
            <strong>{pendingCount}</strong>
          </div>
          <div className="metric-card">
            <span>Status</span>
            <strong>{isOnline ? "Online" : "Offline"}</strong>
          </div>
        </div>
      </header>

      <main className="main-grid">
        <ReportForm onSubmit={handleSubmit} isOnline={isOnline} saveMessage={saveMessage} />
        <Dashboard
          reports={filteredReports}
          filters={filters}
          onFilterChange={(field, value) => setFilters((current) => ({ ...current, [field]: value }))}
          onSyncPending={syncPendingReports}
          pendingCount={pendingCount}
          isOnline={isOnline}
        />
      </main>
    </div>
  );
}

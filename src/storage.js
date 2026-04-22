import localforage from "localforage";

const reportsStore = localforage.createInstance({
  name: "store-visit-report",
  storeName: "reports"
});

const queueStore = localforage.createInstance({
  name: "store-visit-report",
  storeName: "sync-queue"
});

export const getReports = async () => (await reportsStore.getItem("all")) || [];

export const saveReports = async (reports) => {
  await reportsStore.setItem("all", reports);
};

export const upsertReport = async (report) => {
  const reports = await getReports();
  const index = reports.findIndex((item) => item.id === report.id);

  if (index >= 0) {
    reports[index] = report;
  } else {
    reports.unshift(report);
  }

  await saveReports(reports);
  return report;
};

export const queuePendingReport = async (reportId) => {
  const queue = await getSyncQueue();
  if (!queue.includes(reportId)) {
    queue.push(reportId);
    await queueStore.setItem("pending", queue);
  }
};

export const removeQueuedReport = async (reportId) => {
  const queue = await getSyncQueue();
  await queueStore.setItem(
    "pending",
    queue.filter((id) => id !== reportId)
  );
};

export const getSyncQueue = async () => (await queueStore.getItem("pending")) || [];

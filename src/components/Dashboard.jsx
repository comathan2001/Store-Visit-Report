import { StatusBadge } from "./StatusBadge";

export function Dashboard({
  reports,
  filters,
  onFilterChange,
  onSyncPending,
  pendingCount,
  isOnline
}) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Visit Reports</h2>
        </div>
        <button className="secondary-button" onClick={onSyncPending} disabled={!isOnline || pendingCount === 0}>
          Sync Pending ({pendingCount})
        </button>
      </div>

      <div className="filter-grid">
        <label>
          Store Name
          <input
            type="text"
            value={filters.storeName}
            onChange={(event) => onFilterChange("storeName", event.target.value)}
            placeholder="Filter by store"
          />
        </label>
        <label>
          From
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => onFilterChange("dateFrom", event.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={filters.dateTo}
            onChange={(event) => onFilterChange("dateTo", event.target.value)}
          />
        </label>
        <label>
          Issue Status
          <select value={filters.issueStatus} onChange={(event) => onFilterChange("issueStatus", event.target.value)}>
            <option value="">All</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </label>
        <label>
          Sync Status
          <select value={filters.syncStatus} onChange={(event) => onFilterChange("syncStatus", event.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending Sync</option>
            <option value="synced">Synced</option>
          </select>
        </label>
      </div>

      <div className="report-list">
        {reports.length === 0 ? (
          <div className="empty-state">No reports match the current filters.</div>
        ) : (
          reports.map((report) => (
            <article className="report-card" key={report.id}>
              <div className="report-card-header">
                <div>
                  <h3>{report.storeName}</h3>
                  <p>
                    {report.visitDate} • {report.salesRepName}
                  </p>
                </div>
                <StatusBadge status={report.syncStatus === "pending" && !isOnline ? "offline" : report.syncStatus} />
              </div>

              <div className="report-meta">
                <span>Created: {new Date(report.createdAt).toLocaleString()}</span>
                <span>Issues: {report.issues.length}</span>
                <span>Sales: {report.runningSales || 0}</span>
              </div>

              {report.issues.length > 0 && (
                <div className="issue-preview-list">
                  {report.issues.map((issue, index) => (
                    <div className="issue-preview" key={`${report.id}-${index}`}>
                      <strong>{issue.status}</strong>
                      <p>{issue.description || "No description"}</p>
                      <span>{issue.dueDate || "No due date"}</span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

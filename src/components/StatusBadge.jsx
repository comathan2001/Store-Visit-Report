const labels = {
  pending: "Pending Sync",
  synced: "Synced",
  offline: "Saved Offline"
};

export function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{labels[status] || status}</span>;
}

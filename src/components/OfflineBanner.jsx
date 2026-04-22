export function OfflineBanner({ isOnline }) {
  if (isOnline) {
    return null;
  }

  return (
    <div className="offline-banner" role="status">
      Offline Mode Active
    </div>
  );
}

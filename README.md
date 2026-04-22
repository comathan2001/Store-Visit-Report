# Store Visit Report

Shared store visit report and audit app for a local team network.

## What It Does

- Serves a single mobile-friendly web app from the Express server
- Stores shared reports on the server in `server/data/reports.json`
- Lets multiple team members use the same app and see the same reports
- Syncs new reports and issue status updates through the shared backend
- Keeps a small browser cache and pending-action queue for short disconnects

## Run

Install backend dependencies:

```bash
cd server
npm install
```

Start the server:

```bash
npm run dev
```

Open the app on the host machine:

```text
http://localhost:4000
```

Open it on other devices on the same Wi-Fi using the host computer's local IP:

```text
http://YOUR_LOCAL_IP:4000
```

On macOS, find the host IP with:

```bash
ipconfig getifaddr en0
```

If that shows nothing, try:

```bash
ipconfig getifaddr en1
```

## Notes

- The server must stay running for team sync to work.
- The browser still keeps a local cache, but the server is now the shared source of truth.
- `Clear Saved Reports` only clears the current browser's local cache and pending queue. It does not delete the shared server reports.

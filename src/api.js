const parseResponse = async (response) => {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload;
};

export const createReportRequest = async (report) => {
  const response = await fetch("/api/reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(report)
  });

  return parseResponse(response);
};

export const fetchReportsRequest = async () => {
  const response = await fetch("/api/reports");
  return parseResponse(response);
};

export const syncReportsRequest = async (reports) => {
  const response = await fetch("/api/sync-reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ reports })
  });

  return parseResponse(response);
};

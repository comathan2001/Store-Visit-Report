const today = () => new Date().toISOString().split("T")[0];

export const observationFields = [
  ["displaySpace", "Display Space Maximization"],
  ["defectiveItems", "Defective Items Handling"],
  ["dropLights", "Drop Lights Compliance"],
  ["cleanliness", "Cleanliness & Presentation"],
  ["attitude", "Promodiser Attitude"],
  ["knowledge", "Product Knowledge"],
  ["competitor", "Competitor Insights"],
  ["other", "Other Observations"]
];

export const issueStatuses = ["Open", "In Progress", "Resolved"];

export const syncStatuses = ["pending", "synced"];

export const createEmptyIssue = () => ({
  description: "",
  actionPlan: "",
  assignedTo: "",
  dueDate: "",
  status: "Open"
});

export const createInitialForm = () => ({
  storeName: "",
  visitDate: today(),
  salesRepName: "",
  rovingCoordinator: "",
  promodisersPresent: "",
  runningSales: "",
  observations: {
    displaySpace: "",
    defectiveItems: "",
    dropLights: "",
    cleanliness: "",
    attitude: "",
    knowledge: "",
    competitor: "",
    other: ""
  },
  issues: [createEmptyIssue()],
  notes: ""
});

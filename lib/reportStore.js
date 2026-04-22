import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "reports.json");

export const ensureDataFile = async () => {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, "[]", "utf8");
  }
};

export const getAllReports = async () => {
  const fileContents = await fs.readFile(dataFile, "utf8");
  return JSON.parse(fileContents);
};

export const saveReports = async (reports) => {
  await fs.writeFile(dataFile, JSON.stringify(reports, null, 2), "utf8");
};

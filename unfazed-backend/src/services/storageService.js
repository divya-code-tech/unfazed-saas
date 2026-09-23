import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const invoicesDirectory = path.resolve(
  __dirname,
  "../../storage/invoices"
);

export const saveInvoice = async (fileName, buffer) => {
  try {
    await fs.mkdir(invoicesDirectory, {
      recursive: true,
    });
  } catch (error) {
    // Ignore the error when the directory already exists
    if (error.code !== "EEXIST") {
      throw error;
    }
  }

  const safeFileName = path.basename(fileName);
  const filePath = path.join(invoicesDirectory, safeFileName);

  await fs.writeFile(filePath, buffer);

  return {
    fileName: safeFileName,
    filePath,
  };
};

export const getInvoicePath = (fileName) => {
  const safeFileName = path.basename(fileName);

  return path.join(
    invoicesDirectory,
    safeFileName
  );
};

export default {
  saveInvoice,
  getInvoicePath,
};
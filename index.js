import cluster from "cluster";
import { existsSync } from "fs";
import { writeFileSync } from "fs";
import XLSX from "xlsx";

const filePath = "./raw/Target_Model_Baseline_trimmed.xlsx";

if (cluster.isPrimary) {
  const workbook = XLSX.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  let remainingSheetNames = [...sheetNames]; // Copy of the sheet names array

  console.log(`Master ${process.pid} is running`);

  sheetNames.forEach((sheetName) => {
    const outputFilePath = `./raw/json/${sheetName
      .replaceAll(" ", "_")
      .toLowerCase()}.json`;

    // Check if the file already exists
    if (!existsSync(outputFilePath)) {
      const worker = cluster.fork();
      worker.on("online", () => {
        setTimeout(() => {
          console.log(`${worker.process.pid}, ${sheetName} started`);
          worker.send({ sheetName, filePath });
        }, 1000);
      });

      worker.on("exit", () => {
        console.log(`Worker for sheet ${sheetName} finished.`);
        remainingSheetNames = remainingSheetNames.filter(
          (name) => name !== sheetName
        );
        console.log(
          `Worker finished. Remaining sheets: [${remainingSheetNames.join(
            ", "
          )}]`
        );
      });
    } else {
      console.log(`Skipping ${sheetName} as output file already exists.`);
      remainingSheetNames = remainingSheetNames.filter(
        (name) => name !== sheetName
      );
    }
  });

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} finished.`);
  });
} else {
  process.on("message", ({ sheetName, filePath }) => {
    console.log(`Worker ${process.pid} processing ${sheetName}`);

    const outputFilePath = `./data/${sheetName
      .replaceAll(" ", "_")
      .toLowerCase()}.json`;

    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Worker ${process.pid} processed sheet: ${sheetName}`);
    writeFileSync(outputFilePath, JSON.stringify(data, null, 4));

    process.exit();
  });

  console.log(`Worker ${process.pid} started`);
}

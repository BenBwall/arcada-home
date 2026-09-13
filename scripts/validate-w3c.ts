import { resolve } from "node:path";
import { validateBuild } from "./w3c";

validateBuild(resolve(__dirname, "../build"), process.argv[2])
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });

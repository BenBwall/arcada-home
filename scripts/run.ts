import { create } from "ts-node";
import { plugin } from "bun";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type DeploymentCommand = { main: () => void };
const commands = ["setup-deploy", "retry-deploy", "deploy"];

const registerTypeScriptCompiler = (): void => {
  // Compile and type-check copied deployment scripts before Bun loads them.
  const compiler = create({
    compilerOptions: { module: "ESNext", moduleResolution: "Bundler" },
    project: resolve(__dirname, "tsconfig.json"),
  });
  plugin({
    name: "ts-node-deployment-scripts",
    setup: (build) => {
      build.onLoad({ filter: /\.ts$/ }, ({ path: filename }) => ({
        contents: compiler.compile(readFileSync(filename, "utf8"), filename),
        loader: "js",
      }));
    },
  });
};

const isDeploymentCommand = (value: unknown): value is DeploymentCommand =>
  typeof value === "object" &&
  value !== null &&
  "main" in value &&
  typeof value.main === "function";

const execute = async (): Promise<void> => {
  const command = process.argv[2];
  if (!commands.includes(command)) {
    throw new Error("Expected setup-deploy, retry-deploy, or deploy.");
  }
  // Leave only the command's own arguments for parseArgs().
  process.argv.splice(2, 1);
  registerTypeScriptCompiler();
  const module: unknown = await import(resolve(__dirname, `${command}.ts`));
  if (!isDeploymentCommand(module)) {
    throw new Error("Deployment module must export a main function.");
  }
  module.main();
};

execute().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

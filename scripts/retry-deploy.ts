import { deploy } from "./deploy";
import { runCommand } from "./shared";

const readConfigPath = (): string => {
  try {
    return runCommand("git", ["config", "--get", "arcada.deployConfig"] as const, {
      capture: true,
    });
  } catch {
    throw new Error("Run bun run deploy:setup first.");
  }
};

export const main = (): void => {
  deploy("retry", readConfigPath());
};

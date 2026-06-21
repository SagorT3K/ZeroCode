import type { Command } from "commander";
import { createAgentCommand } from "../agent.command.js";
import type { ProgramContext } from "./program-context.js";

/**
 * Register maintenance-related commands.
 * Includes the new 'agent' command for local project automation.
 */
export async function registerMaintenanceCommands(
  program: Command,
  ctx: ProgramContext,
): Promise<void> {
  // Register the agent command
  const agentCommand = createAgentCommand();
  program.addCommand(agentCommand);
}

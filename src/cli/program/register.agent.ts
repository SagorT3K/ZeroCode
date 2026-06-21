import type { Command } from "commander";
import { getAllModelIds } from "../../chat/chat-clients.js";
import { readPersistenceAndGetCurrentConfig } from "../../config/read-persistence.js";
import { throwDisplayErrorWithBacktrace } from "../../infra/error-display.js";
import type { ProgramContext } from "./program-context.js";
import { createAgentCommand } from "../agent.command.js";

/**
 * Register the 'agent' command to the program.
 * This command enables local project automation through AI-driven operations.
 */
export async function registerAgentCommand(
  program: Command,
  _ctx: ProgramContext,
): Promise<void> {
  try {
    const agentCommand = createAgentCommand();
    program.addCommand(agentCommand);
  } catch (error) {
    throwDisplayErrorWithBacktrace(error);
  }
}

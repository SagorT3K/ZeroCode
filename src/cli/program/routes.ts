import type { Command } from "commander";
import type { ProgramContext } from "./program-context.js";

/**
 * Route commands to their registration functions.
 * Updated to include 'agent' command routing.
 */
export async function registerRouteCommand(
  program: Command,
  ctx: ProgramContext,
  command: string,
): Promise<boolean> {
  // Agent command
  if (command === "agent") {
    const { registerAgentCommand } = await import("./register.agent.js");
    await registerAgentCommand(program, ctx);
    return true;
  }

  // ... existing route handlers
  return false;
}

/**
 * Core CLI command descriptors.
 * Updated to include the new 'agent' command for local project automation.
 */
export const CORE_COMMAND_DESCRIPTORS = [
  // Project automation
  {
    name: "agent",
    description: "Local project automation assistant (AI-driven)",
    register: () => import("./register.agent.js").then(m => m.registerAgentCommand),
  },
  // ... existing commands remain here
] as const;

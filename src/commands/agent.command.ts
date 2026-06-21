/**
 * Local Agent CLI Command
 * Usage: node openclaw.mjs agent "your prompt here"
 * 
 * This command enables project automation through AI-driven local operations.
 */

import { Command } from "commander";
import { LocalAgent } from "../agents/local-agent.js";
import fs from "fs/promises";
import path from "path";
import os from "os";

const loadConfig = async () => {
  try {
    const configPath = path.join(
      os.homedir(),
      ".openclaw-zero-state",
      "openclaw.json"
    );
    const content = await fs.readFile(configPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
};

const getGatewayUrl = (config: unknown): string => {
  const cfg = config as { gateway?: { baseUrl?: string } } | undefined;
  return cfg?.gateway?.baseUrl || "http://localhost:3001";
};

const getGatewayToken = (config: unknown): string => {
  const cfg = config as { gateway?: { auth?: { token?: string } } } | undefined;
  return cfg?.gateway?.auth?.token || "openclaw";
};

const getWorkspace = (config: unknown): string => {
  const cfg = config as { agents?: { defaults?: { workspace?: string } } } | undefined;
  return cfg?.agents?.defaults?.workspace || process.cwd();
};

const getModel = (config: unknown): string => {
  const cfg = config as { models?: { default?: string } } | undefined;
  return cfg?.models?.default || "deepseek-web/deepseek-chat";
};

const formatResult = (result: Awaited<ReturnType<typeof runAgent>>) => {
  console.log("\n" + "=".repeat(60));
  console.log("📋 AGENT EXECUTION RESULT");
  console.log("=".repeat(60));
  
  console.log(`\n✅ Status: ${result.success ? "SUCCESS" : "FAILED"}`);
  console.log(`📝 Message: ${result.message}\n`);
  
  if (result.filesModified.length > 0) {
    console.log("📁 Files Modified:");
    result.filesModified.forEach((f) => console.log(`  • ${f}`));
  }
  
  if (result.commandsExecuted.length > 0) {
    console.log("\n🔧 Commands Executed:");
    result.commandsExecuted.forEach((c) => console.log(`  • ${c}`));
  }
  
  if (result.errors && result.errors.length > 0) {
    console.log("\n⚠️  Errors:");
    result.errors.forEach((e) => console.log(`  • ${e}`));
  }
  
  console.log("\n" + "=".repeat(60) + "\n");
};

const runAgent = async (prompt: string, options: { model?: string; workspace?: string } = {}) => {
  const config = await loadConfig();
  const gatewayUrl = getGatewayUrl(config);
  const gatewayToken = getGatewayToken(config);
  const workspace = options.workspace || getWorkspace(config);
  const model = options.model || getModel(config);

  const agent = new LocalAgent({
    gatewayUrl,
    gatewayToken,
    workspaceDir: workspace,
    model,
  });

  try {
    console.log("🤖 Local Agent Starting...");
    console.log(`📍 Workspace: ${workspace}`);
    console.log(`🧠 Model: ${model}\n`);

    // Get project structure for context
    console.log("📊 Analyzing project structure...");
    const projectStructure = await agent.getProjectStructure();
    const context = `Project Structure:\n${projectStructure}\n\nWorkspace: ${workspace}`;

    // Get AI suggestions
    console.log("💭 Consulting AI for suggestions...\n");
    const suggestions = await agent.getAISuggestions(prompt, context);
    console.log("AI Suggestions:");
    console.log("-".repeat(60));
    console.log(suggestions);
    console.log("-".repeat(60));
    console.log();

    return agent.getResult(
      true,
      "Agent completed. Review suggestions above and implement manually or configure automated execution."
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return agent.getResult(false, message);
  }
};

export const createAgentCommand = () => {
  const cmd = new Command("agent")
    .description("Local project automation assistant")
    .argument("<prompt>", "What would you like the agent to do?")
    .option(
      "-m, --model <model>",
      "AI model to use (e.g., deepseek-web/deepseek-chat, claude-web/claude-sonnet-4-6)"
    )
    .option("-w, --workspace <dir>", "Project workspace directory")
    .action(async (prompt: string, options: Record<string, unknown>) => {
      const result = await runAgent(prompt, {
        model: options.model as string | undefined,
        workspace: options.workspace as string | undefined,
      });
      formatResult(result);
      process.exit(result.success ? 0 : 1);
    });

  return cmd;
};

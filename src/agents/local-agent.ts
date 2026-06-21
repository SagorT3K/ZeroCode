/**
 * Local Agent Engine
 * Coordinates with OpenClaw gateway to perform local project operations:
 * - Read/write files
 * - Execute terminal commands
 * - Analyze project structure
 * - Generate and apply changes
 */

import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface AgentConfig {
  gatewayUrl: string;
  gatewayToken: string;
  workspaceDir: string;
  model?: string;
}

export interface LocalAgentResult {
  success: boolean;
  message: string;
  filesModified: string[];
  commandsExecuted: string[];
  errors?: string[];
}

/**
 * LocalAgent handles all local filesystem and terminal operations
 */
export class LocalAgent {
  private config: AgentConfig;
  private filesModified: string[] = [];
  private commandsExecuted: string[] = [];
  private errors: string[] = [];

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Read a file from the workspace
   */
  async readFile(relativePath: string): Promise<string> {
    try {
      const fullPath = path.join(this.config.workspaceDir, relativePath);
      this.validatePath(fullPath);
      const content = await fs.readFile(fullPath, "utf-8");
      return content;
    } catch (error) {
      const errMsg = `Failed to read ${relativePath}: ${error instanceof Error ? error.message : String(error)}`;
      this.errors.push(errMsg);
      throw new Error(errMsg);
    }
  }

  /**
   * Write/create a file in the workspace
   */
  async writeFile(relativePath: string, content: string): Promise<void> {
    try {
      const fullPath = path.join(this.config.workspaceDir, relativePath);
      this.validatePath(fullPath);
      
      // Ensure directory exists
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(fullPath, content, "utf-8");
      this.filesModified.push(relativePath);
    } catch (error) {
      const errMsg = `Failed to write ${relativePath}: ${error instanceof Error ? error.message : String(error)}`;
      this.errors.push(errMsg);
      throw new Error(errMsg);
    }
  }

  /**
   * List files in a directory
   */
  async listDir(relativePath: string = "."): Promise<string[]> {
    try {
      const fullPath = path.join(this.config.workspaceDir, relativePath);
      this.validatePath(fullPath);
      
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      return entries.map((e) => (e.isDirectory() ? `${e.name}/` : e.name));
    } catch (error) {
      const errMsg = `Failed to list ${relativePath}: ${error instanceof Error ? error.message : String(error)}`;
      this.errors.push(errMsg);
      throw new Error(errMsg);
    }
  }

  /**
   * Get project structure overview
   */
  async getProjectStructure(): Promise<string> {
    try {
      const structure = await this.buildTree(".", 0, 3);
      return structure;
    } catch (error) {
      const errMsg = `Failed to get project structure: ${error instanceof Error ? error.message : String(error)}`;
      this.errors.push(errMsg);
      throw new Error(errMsg);
    }
  }

  /**
   * Execute a terminal command
   */
  async executeCommand(command: string, description?: string): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.config.workspaceDir,
        maxBuffer: 1024 * 1024 * 10, // 10MB
      });

      if (stderr) {
        this.errors.push(`Command stderr: ${stderr}`);
      }

      const cmd = description || command;
      this.commandsExecuted.push(cmd);
      return stdout;
    } catch (error) {
      const errMsg = `Command failed: ${error instanceof Error ? error.message : String(error)}`;
      this.errors.push(errMsg);
      throw new Error(errMsg);
    }
  }

  /**
   * Call OpenClaw gateway to get AI suggestions
   */
  async getAISuggestions(prompt: string, context: string): Promise<string> {
    try {
      const fullPrompt = `You are a helpful project automation assistant.

Context:
${context}

User Request:
${prompt}

Provide specific file operations, commands, or code changes needed. Format responses as:
1. File operations (create/modify/delete)
2. Terminal commands to run
3. Explanation of changes`;

      const response = await fetch(
        `${this.config.gatewayUrl}/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.config.gatewayToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.config.model || "deepseek-web/deepseek-chat",
            messages: [
              {
                role: "user",
                content: fullPrompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Gateway error: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
      return data.choices[0]?.message?.content || "";
    } catch (error) {
      const errMsg = `AI suggestion failed: ${error instanceof Error ? error.message : String(error)}`;
      this.errors.push(errMsg);
      throw new Error(errMsg);
    }
  }

  /**
   * Get result summary
   */
  getResult(success: boolean, message: string): LocalAgentResult {
    return {
      success,
      message,
      filesModified: this.filesModified,
      commandsExecuted: this.commandsExecuted,
      errors: this.errors.length > 0 ? this.errors : undefined,
    };
  }

  /**
   * Validate path is within workspace (security)
   */
  private validatePath(fullPath: string): void {
    const resolved = path.resolve(fullPath);
    const workspace = path.resolve(this.config.workspaceDir);
    
    if (!resolved.startsWith(workspace)) {
      throw new Error(
        `Path ${resolved} is outside workspace ${workspace}`
      );
    }
  }

  /**
   * Recursively build directory tree
   */
  private async buildTree(
    dir: string,
    indent: number,
    maxDepth: number
  ): Promise<string> {
    if (indent > maxDepth * 2) return "";

    const fullPath = path.join(this.config.workspaceDir, dir);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const ignored = [".git", "node_modules", "dist", ".next", "build", ".env"];
    const filtered = entries.filter((e) => !ignored.includes(e.name));

    let result = "";
    for (const entry of filtered) {
      const prefix = "  ".repeat(indent / 2);
      if (entry.isDirectory()) {
        result += `${prefix}📁 ${entry.name}/\n`;
        if (indent < maxDepth * 2) {
          const subTree = await this.buildTree(
            path.join(dir, entry.name),
            indent + 2,
            maxDepth
          );
          result += subTree;
        }
      } else {
        result += `${prefix}📄 ${entry.name}\n`;
      }
    }

    return result;
  }
}

# 🤖 Local Agent CLI Tool

**Use All Major AI Models to Automate Your Local Projects** — NO API Tokens Required!

The Local Agent is a Cursor-like CLI tool that coordinates with OpenClaw Zero Token to automate project tasks locally. It can:

- 📁 **Read and modify files** (safely confined to workspace)
- 🔧 **Execute terminal commands** (npm, git, build tools, etc.)
- 📊 **Analyze project structure** and provide AI suggestions
- 🤖 **Leverage any OpenClaw-supported AI model** (DeepSeek, Claude, ChatGPT, Qwen, etc.)
- ⚡ **Generate code and project scaffolding**
- 🛠️ **Automate repetitive development tasks**

---

## Quick Start

### 1. Ensure OpenClaw server is running

```bash
./server.sh
# Gateway starts on http://localhost:3001
```

### 2. Use the agent

```bash
# Basic usage
node openclaw.mjs agent "setup a TypeScript project with tests"

# Specify AI model
node openclaw.mjs agent "write a React component" --model claude-web/claude-sonnet-4-6

# Specify workspace
node openclaw.mjs agent "add ESLint configuration" --workspace /path/to/project
```

---

## Usage Examples

### Example 1: Create a New TypeScript Project

```bash
node openclaw.mjs agent "Initialize a TypeScript project with package.json, tsconfig.json, and a simple src/index.ts file"
```

Agent will:
1. ✅ Analyze current project structure
2. ✅ Consult AI (DeepSeek/Claude/etc.) for best practices
3. ✅ Display suggestions for files to create
4. ✅ List commands to run (npm install, build scripts, etc.)

### Example 2: Fix Import Errors

```bash
node openclaw.mjs agent "read src/index.ts and fix any import errors"
```

Agent will:
1. ✅ Read the file
2. ✅ Identify issues
3. ✅ Suggest fixes
4. ✅ Show corrected code

### Example 3: Add Tests

```bash
node openclaw.mjs agent "add Jest unit tests for src/utils.ts, create tests/ directory structure"
```

Agent will:
1. ✅ Analyze the utils module
2. ✅ Generate test cases
3. ✅ Create test files
4. ✅ Suggest test configuration

### Example 4: Setup Development Environment

```bash
node openclaw.mjs agent "setup ESLint, Prettier, and Git hooks for this project"
```

Agent will:
1. ✅ Create config files (.eslintrc, .prettierrc, husky config)
2. ✅ Install required packages
3. ✅ Configure Git pre-commit hooks

---

## How It Works

```
┌─────────────────────────────────────┐
│  Your Terminal / Dev Environment   │
└────────────┬────────────────────────┘
             │
    node openclaw.mjs agent "..."
             │
             ▼
┌─────────────────────────────────────┐
│  Local Agent (TypeScript)           │
├─────────────────────────────────────┤
│  1. Analyze project structure       │
│  2. Read relevant files             │
│  3. Send context to AI gateway      │
│  4. Receive suggestions             │
│  5. Execute commands (optional)     │
│  6. Apply file changes (optional)   │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  OpenClaw Gateway (Port 3001)       │
├─────────────────────────────────────┤
│  Routes to configured AI models:    │
│  • DeepSeek Web (free)              │
│  • Claude Web (free)                │
│  • ChatGPT Web (free)               │
│  • Qwen Web (free)                  │
│  • Kimi, Doubao, Grok, etc.         │
└─────────────────────────────────────┘
```

---

## API Overview

### LocalAgent Class

```typescript
const agent = new LocalAgent({
  gatewayUrl: "http://localhost:3001",
  gatewayToken: "openclaw",
  workspaceDir: "/path/to/project",
  model: "deepseek-web/deepseek-chat",
});

// Read files
const content = await agent.readFile("src/index.ts");

// Write files
await agent.writeFile("src/new-file.ts", "console.log('hello');");

// List directory
const files = await agent.listDir("src");

// Get project tree
const structure = await agent.getProjectStructure();

// Execute commands
const output = await agent.executeCommand("npm install", "Install dependencies");

// Get AI suggestions
const suggestions = await agent.getAISuggestions(
  "add TypeScript",
  "Current project structure: ..."
);
```

---

## Configuration

The agent automatically uses your OpenClaw configuration from `~/.openclaw-zero-state/openclaw.json`:

```json
{
  "gateway": {
    "baseUrl": "http://localhost:3001",
    "auth": {
      "token": "openclaw"
    }
  },
  "agents": {
    "defaults": {
      "workspace": "/path/to/workspace"
    }
  },
  "models": {
    "default": "deepseek-web/deepseek-chat"
  }
}
```

### Override via CLI

```bash
# Use different model
node openclaw.mjs agent "..." --model claude-web/claude-sonnet-4-6

# Use different workspace
node openclaw.mjs agent "..." --workspace /path/to/other/project
```

---

## Safety & Security

✅ **All file operations are confined to the workspace directory**
- Agent cannot read/write files outside workspace
- Path validation prevents directory traversal attacks

✅ **Credentials are never exposed**
- Gateway token stays in local config
- No sensitive data sent to AI models

✅ **Commands are sandboxed**
- Executed in workspace directory only
- You review all suggestions before confirming

✅ **No automatic file modification**
- Agent shows suggestions
- You manually approve and apply changes

---

## Troubleshooting

### Gateway Connection Error

```bash
# Make sure OpenClaw server is running
./server.sh

# Check if gateway is accessible
curl http://localhost:3001/health
```

### Model Not Found

```bash
# List available models
node openclaw.mjs /models

# Make sure you logged in to the provider
./onboard.sh webauth
```

### Path Outside Workspace

```
Error: Path /etc/passwd is outside workspace /home/user/project
```

→ Agent only works within the configured workspace for security.

### Command Execution Failed

```bash
# Try running the command directly in terminal
cd /path/to/workspace
npm install

# Check if required tools are installed
which npm
which git
```

---

## Advanced Usage

### Custom Agent Workflows

You can extend LocalAgent for custom tasks:

```typescript
import { LocalAgent } from "./src/agents/local-agent.js";

const agent = new LocalAgent({
  gatewayUrl: "http://localhost:3001",
  gatewayToken: "openclaw",
  workspaceDir: process.cwd(),
});

// Custom workflow: Setup project with all best practices
const projectStructure = await agent.getProjectStructure();
const suggestions = await agent.getAISuggestions(
  "Setup production-ready project",
  projectStructure
);

console.log(suggestions);
```

### Integration with Build Tools

```bash
# Use agent in npm scripts
node openclaw.mjs agent "Generate changelog from git commits"

# Chain multiple agent calls
node openclaw.mjs agent "Create src/types.ts" && \
node openclaw.mjs agent "Generate API client from OpenAPI spec"
```

---

## Roadmap

- 🔜 Automated file modifications (with approval)
- 🔜 Interactive mode (prompts for confirmation)
- 🔜 Batch operations (process multiple files)
- 🔜 Custom tool definitions (extend agent capabilities)
- 🔜 Session history and undo
- 🔜 Integration with version control (git operations)

---

## Contributing

Want to improve the Local Agent? PRs welcome for:

- Additional file operations
- Better AI prompt engineering
- Integration with more tools
- Documentation improvements

---

## License

MIT License — Same as OpenClaw

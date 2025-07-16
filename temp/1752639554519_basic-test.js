/**
 * Simple demo script to test basic VS Code extension functionality
 * This focuses on testing the components without relying on AI generation
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Import the compiled extension modules
const { OllamaAPI } = require("./out/api");
const { ContextManager } = require("./out/context");

// Test configuration
const TEST_CONFIG = {
  ollama: {
    baseUrl: "http://localhost:11434",
    model: "qwen2.5-coder:1.5b",
    timeout: 30000,
    temperature: 0,
    topP: 1,
  },
  contextWindow: 20,
  maxSuggestions: 3,
  debug: true,
};

// Colors for console output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, "green");
}

function error(message) {
  log(`❌ ${message}`, "red");
}

function info(message) {
  log(`ℹ️  ${message}`, "blue");
}

async function testBasicComponents() {
  log("\n🔧 Testing Basic Extension Components\n", "bold");

  let allPassed = true;

  // 1. Test Ollama connectivity
  info("1. Testing Ollama connectivity...");
  try {
    const response = await axios.get(`${TEST_CONFIG.ollama.baseUrl}/api/tags`, {
      timeout: 5000,
    });

    if (response.status === 200) {
      success("Ollama server is accessible");

      const models = response.data.models || [];
      const modelExists = models.some((m) =>
        m.name.includes(TEST_CONFIG.ollama.model.split(":")[0])
      );

      if (modelExists) {
        success(`Model '${TEST_CONFIG.ollama.model}' is available`);
      } else {
        error(`Model '${TEST_CONFIG.ollama.model}' not found`);
        info("Available models: " + models.map((m) => m.name).join(", "));
        allPassed = false;
      }
    }
  } catch (err) {
    error(`Failed to connect to Ollama: ${err.message}`);
    allPassed = false;
  }

  // 2. Test OllamaAPI instantiation
  info("2. Testing OllamaAPI instantiation...");
  try {
    const api = new OllamaAPI(TEST_CONFIG.ollama);
    const isHealthy = await api.healthCheck();

    if (isHealthy) {
      success("OllamaAPI health check passed");
    } else {
      error("OllamaAPI health check failed");
      allPassed = false;
    }
  } catch (err) {
    error(`OllamaAPI test failed: ${err.message}`);
    allPassed = false;
  }

  // 3. Test ContextManager
  info("3. Testing ContextManager...");
  try {
    // Create a test file
    const testFilePath = path.join(__dirname, "temp", "demo-test.js");
    const testContent = `function greet(name) {
  console.log("Hello, " + name);
}

function farewell(name) {
  // Add implementation here
}`;

    // Ensure temp directory exists
    const tempDir = path.join(__dirname, "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(testFilePath, testContent);

    const contextManager = new ContextManager(TEST_CONFIG.contextWindow);
    const cursor = [5, 2]; // Inside the farewell function
    const context = await contextManager.createContext(testFilePath, cursor);

    if (context && context.filename && context.current) {
      success("ContextManager successfully created context");
      info(`  - Filename: ${path.basename(context.filename)}`);
      info(`  - File type: ${context.filetype}`);
      info(
        `  - Content lines: ${
          context.currentVersion.content.split("\n").length
        }`
      );
      info(
        `  - Cursor position: [${context.currentVersion.cursor[0]}, ${context.currentVersion.cursor[1]}]`
      );
    } else {
      error("ContextManager failed to create context");
      allPassed = false;
    }

    // Clean up
    fs.unlinkSync(testFilePath);
  } catch (err) {
    error(`ContextManager test failed: ${err.message}`);
    allPassed = false;
  }

  // 4. Test Extension Package Structure
  info("4. Testing extension package structure...");
  try {
    const packagePath = path.join(__dirname, "package.json");
    const packageContent = JSON.parse(fs.readFileSync(packagePath, "utf8"));

    // Check important fields
    const checks = [
      { field: "main", expected: "./out/extension.js" },
      { field: "name", expected: "nes-vscode" },
      { field: "engines.vscode", exists: true },
    ];

    let packageOk = true;
    for (const check of checks) {
      if (check.expected) {
        if (packageContent[check.field] === check.expected) {
          success(`  - ${check.field}: ✓`);
        } else {
          error(`  - ${check.field}: ✗ (expected: ${check.expected})`);
          packageOk = false;
        }
      } else if (check.exists) {
        if (packageContent.engines && packageContent.engines.vscode) {
          success(`  - engines.vscode: ✓`);
        } else {
          error(`  - engines.vscode: ✗ (missing)`);
          packageOk = false;
        }
      }
    }

    // Check if main file exists
    const mainFile = path.join(__dirname, packageContent.main);
    if (fs.existsSync(mainFile)) {
      success("  - Main entry point exists: ✓");
    } else {
      error("  - Main entry point exists: ✗");
      packageOk = false;
    }

    if (!packageOk) {
      allPassed = false;
    }
  } catch (err) {
    error(`Package structure test failed: ${err.message}`);
    allPassed = false;
  }

  // 5. Test VS Code Commands
  info("5. Testing VS Code commands configuration...");
  try {
    const packagePath = path.join(__dirname, "package.json");
    const packageContent = JSON.parse(fs.readFileSync(packagePath, "utf8"));

    const expectedCommands = [
      "nes.getSuggestion",
      "nes.applySuggestion",
      "nes.showSettings",
      "nes.healthCheck",
    ];

    const actualCommands =
      packageContent.contributes?.commands?.map((cmd) => cmd.command) || [];

    let commandsOk = true;
    for (const expectedCmd of expectedCommands) {
      if (actualCommands.includes(expectedCmd)) {
        success(`  - Command '${expectedCmd}': ✓`);
      } else {
        error(`  - Command '${expectedCmd}': ✗`);
        commandsOk = false;
      }
    }

    // Check keybinding
    const keybindings = packageContent.contributes?.keybindings || [];
    const hasKeybinding = keybindings.some(
      (kb) => kb.command === "nes.getSuggestion"
    );

    if (hasKeybinding) {
      success("  - Keybinding for getSuggestion: ✓");
    } else {
      error("  - Keybinding for getSuggestion: ✗");
      commandsOk = false;
    }

    if (!commandsOk) {
      allPassed = false;
    }
  } catch (err) {
    error(`Commands test failed: ${err.message}`);
    allPassed = false;
  }

  // Cleanup
  const tempDir = path.join(__dirname, "temp");
  if (fs.existsSync(tempDir)) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  }

  // Summary
  log("\n📊 Basic Tests Summary\n", "bold");

  if (allPassed) {
    log(
      "🎉 All basic tests passed! The extension structure is correct.",
      "green"
    );
    log("\n📖 How to test the extension:", "bold");
    log(
      "1. Install the extension: code --install-extension nes-vscode-0.1.0.vsix"
    );
    log("2. Open a code file in VS Code");
    log("3. Use Ctrl+Shift+N (or Cmd+Shift+N on Mac) to get suggestions");
    log('4. Or use the command palette: "NES: Get AI Code Suggestion"');
    log("\n⚡ Make sure Ollama is running: ollama serve");
  } else {
    log("🚨 Some basic tests failed. Please fix the issues above.", "red");
  }

  return allPassed;
}

// Run the demo if this script is executed directly
if (require.main === module) {
  testBasicComponents()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((err) => {
      error(`Demo failed: ${err.message}`);
      process.exit(1);
    });
}

module.exports = { testBasicComponents };

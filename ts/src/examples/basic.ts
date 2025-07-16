/**
 * Basic usage example for the NES (Next Edit Suggestion) system
 *
 * This example demonstrates the core functionality of generating and applying
 * AI-powered code edit suggestions.
 */

import NES from "../index";
import * as path from "path";

async function basicExample() {
  console.log("🚀 NES Basic Example");
  console.log("===================");

  try {
    // Initialize NES with custom configuration
    const nes = await NES.setup({
      debug: true,
      ollama: {
        model: "qwen2.5-coder:1.5b",
        baseUrl: "http://localhost:11434",
      },
      contextWindow: 15,
      maxSuggestions: 3,
    });

    console.log("✅ NES initialized successfully");

    // Create a sample TypeScript file for testing
    const testFile = path.join(__dirname, "test-file.ts");
    const sampleCode = `// Sample TypeScript class
class Calculator {
  private result: number = 0;

  add(value: number): Calculator {
    this.result += value;
    return this;
  }

  // TODO: Add subtract method
  // <|cursor|>

  getResult(): number {
    return this.result;
  }
}

export default Calculator;`;

    // Write the test file
    const fs = require("fs");
    await fs.promises.writeFile(testFile, sampleCode.replace("<|cursor|>", ""));
    console.log(`📝 Created test file: ${testFile}`);

    // Parse cursor position from the sample code
    const lines = sampleCode.split("\n");
    let cursor: [number, number] = [0, 0];

    for (let i = 0; i < lines.length; i++) {
      const cursorIndex = lines[i].indexOf("<|cursor|>");
      if (cursorIndex !== -1) {
        cursor = [i, cursorIndex];
        break;
      }
    }

    console.log(
      `🎯 Cursor position: line ${cursor[0] + 1}, column ${cursor[1] + 1}`
    );

    // Generate suggestions
    console.log("🤖 Generating edit suggestions...");
    const suggestions = await nes.getSuggestion(testFile, cursor);

    console.log(`📋 Generated ${suggestions.suggestions.length} suggestions:`);
    suggestions.suggestions.forEach((suggestion, index) => {
      console.log(
        `  ${index + 1}. ${
          suggestion.id
        } (confidence: ${suggestion.confidence?.toFixed(2)})`
      );
      console.log(
        `     Range: ${suggestion.textEdit.range.start.line}-${suggestion.textEdit.range.end.line}`
      );
      console.log(
        `     New text: ${suggestion.textEdit.newText
          .slice(0, 50)
          .replace(/\n/g, "\\n")}...`
      );
    });

    // Apply the first suggestion
    if (suggestions.suggestions.length > 0) {
      console.log("✏️  Applying first suggestion...");
      const applyResult = await nes.applySuggestion(
        suggestions.suggestions[0],
        testFile,
        { backup: true, validate: true }
      );

      if (applyResult.success) {
        console.log("✅ Suggestion applied successfully");
        console.log(`   Lines affected: ${applyResult.linesAffected}`);
        console.log(`   New cursor: ${applyResult.newCursor}`);
        if (applyResult.backupPath) {
          console.log(`   Backup created: ${applyResult.backupPath}`);
        }

        // Show the modified file content
        const modifiedContent = await fs.promises.readFile(testFile, "utf-8");
        console.log("\n📄 Modified file content:");
        console.log("─".repeat(40));
        console.log(modifiedContent);
        console.log("─".repeat(40));
      } else {
        console.error("❌ Failed to apply suggestion:", applyResult.error);
      }
    }

    // Clean up
    console.log("🧹 Cleaning up test files...");
    try {
      await fs.promises.unlink(testFile);
      console.log("🗑️  Removed test file");

      // Remove backup if it exists
      const files = await fs.promises.readdir(__dirname);
      const backupFiles = files.filter((file: string) =>
        file.startsWith("test-file.ts.backup.")
      );
      for (const backupFile of backupFiles) {
        await fs.promises.unlink(path.join(__dirname, backupFile));
        console.log(`🗑️  Removed backup: ${backupFile}`);
      }
    } catch (error) {
      console.warn("⚠️  Could not clean up files:", error);
    }
  } catch (error) {
    console.error("❌ Example failed:", error);

    if (error instanceof Error && error.message.includes("Ollama")) {
      console.log("\n💡 Troubleshooting tips:");
      console.log("1. Make sure Ollama is installed: https://ollama.ai/");
      console.log("2. Start Ollama service: ollama serve");
      console.log("3. Pull the required model: ollama pull qwen2.5-coder:1.5b");
    }

    process.exit(1);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  basicExample()
    .then(() => {
      console.log("🎉 Example completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Example failed:", error);
      process.exit(1);
    });
}

export default basicExample;

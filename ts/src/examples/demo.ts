#!/usr/bin/env node
/**
 * Demo script for NES TypeScript implementation
 *
 * This script demonstrates the complete workflow of the NES system:
 * 1. Initialize NES with proper configuration
 * 2. Process sample files with cursor markers
 * 3. Show before/after comparisons
 * 4. Handle errors gracefully
 */

import { NES } from "../index";
import { FileProcessorCLI } from "./file-processor-cli";
import * as fs from "fs";
import * as path from "path";

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function colorize(text: string, color: keyof typeof COLORS): string {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function header(text: string): void {
  console.log("");
  console.log(colorize("=".repeat(60), "cyan"));
  console.log(colorize(`  ${text}`, "bright"));
  console.log(colorize("=".repeat(60), "cyan"));
  console.log("");
}

function section(text: string): void {
  console.log("");
  console.log(colorize(`📋 ${text}`, "blue"));
  console.log(colorize("-".repeat(40), "blue"));
}

async function checkOllamaConnection(): Promise<boolean> {
  try {
    const nes = new NES({
      ollama: {
        model: "qwen2.5-coder:1.5b",
        timeout: 5000, // Quick timeout for connection check
      },
    });

    console.log("🔍 Checking Ollama connection...");

    // Try to get a simple suggestion to test the full pipeline
    const testFile = path.join(
      __dirname,
      "../sample-files/enhanced-calculator.ts"
    );
    if (!fs.existsSync(testFile)) {
      console.log(
        colorize(
          "⚠️  Sample files not found - they may not have been created yet",
          "yellow"
        )
      );
      return false;
    }

    await nes.getSuggestion(testFile);
    console.log(colorize("✅ Ollama connection successful!", "green"));
    return true;
  } catch (error) {
    console.log(colorize("❌ Ollama connection failed", "red"));
    if (error instanceof Error) {
      if (error.message.includes("connect")) {
        console.log(
          colorize("   💡 Make sure Ollama is running: ollama serve", "yellow")
        );
      } else if (error.message.includes("not found")) {
        console.log(
          colorize(
            "   💡 Make sure the model is available: ollama pull qwen2.5-coder:1.5b",
            "yellow"
          )
        );
      } else {
        console.log(colorize(`   Error: ${error.message}`, "red"));
      }
    }
    return false;
  }
}

async function demonstrateBasicAPI(): Promise<void> {
  section("Basic API Usage");

  const nes = new NES({
    ollama: {
      model: "qwen2.5-coder:1.5b",
      temperature: 0.1,
    },
    debug: true,
  });

  console.log("🔧 NES initialized with configuration:");
  console.log("   Model: qwen2.5-coder:1.5b");
  console.log("   Temperature: 0.1 (deterministic)");
  console.log("   Context Window: 30 lines");

  const config = nes.getConfig();
  console.log(`   Max Suggestions: ${config.maxSuggestions}`);
}

async function demonstrateFileProcessing(): Promise<void> {
  section("File Processing Demonstration");

  const processor = new FileProcessorCLI();

  // Process TypeScript file
  try {
    const inputFile = path.join(
      __dirname,
      "../sample-files/enhanced-calculator.ts"
    );
    const outputFile = path.join(
      __dirname,
      "../output/demo-calculator-output.ts"
    );

    if (!fs.existsSync(inputFile)) {
      console.log(colorize(`⚠️  Input file not found: ${inputFile}`, "yellow"));
      console.log(
        "   The sample files should be in the sample-files directory"
      );
      return;
    }

    console.log("📁 Processing TypeScript file...");
    console.log(`   Input:  ${path.basename(inputFile)}`);
    console.log(`   Output: ${path.basename(outputFile)}`);

    await processor.processFile(inputFile, outputFile);

    if (fs.existsSync(outputFile)) {
      console.log(colorize("✅ File processed successfully!", "green"));

      // Show file comparison
      const originalLines = fs
        .readFileSync(inputFile, "utf-8")
        .split("\n").length;
      const outputLines = fs
        .readFileSync(outputFile, "utf-8")
        .split("\n").length;

      console.log(`📊 Results:`);
      console.log(`   Original: ${originalLines} lines`);
      console.log(`   Output:   ${outputLines} lines`);
      console.log(
        `   Change:   ${outputLines - originalLines > 0 ? "+" : ""}${
          outputLines - originalLines
        } lines`
      );
    }
  } catch (error) {
    console.log(colorize("❌ File processing failed", "red"));
    if (error instanceof Error) {
      console.log(colorize(`   Error: ${error.message}`, "red"));
    }
  }
}

async function showFeatureSummary(): Promise<void> {
  section("Feature Summary");

  const features = [
    "🤖 Local AI processing with Ollama",
    "📝 Support for TypeScript and Python files",
    "🎯 Cursor-based suggestion targeting",
    "🔧 Simple and clean API",
    "📦 Modular architecture with abstraction",
    "🧪 Comprehensive testing suite",
    "📖 Extensive documentation and examples",
    "⚡ Minimal and focused codebase",
  ];

  console.log("The NES TypeScript implementation includes:");
  console.log("");
  features.forEach((feature) => {
    console.log(`   ${feature}`);
  });
}

async function showUsageInstructions(): Promise<void> {
  section("Usage Instructions");

  console.log("To use the NES system:");
  console.log("");
  console.log("1. 🏗️  Build the project:");
  console.log("   npm run build");
  console.log("");
  console.log("2. 🔄 Process files with cursor markers:");
  console.log("   npm run process:calculator");
  console.log("   npm run process:shapes");
  console.log("");
  console.log("3. 🎮 Or run manually:");
  console.log("   node dist/examples/file-processor-cli.js input.ts output.ts");
  console.log("");
  console.log("4. 🧪 Run tests:");
  console.log("   npm test");
  console.log("");
  console.log("📁 Sample files are in: sample-files/");
  console.log("📤 Output files go to: output/");
  console.log("");
  console.log("📖 For more details, see IMPLEMENTATION.md");
}

async function main(): Promise<void> {
  header("NES TypeScript Implementation Demo");

  console.log(
    colorize(
      "Welcome to the NES (Next Edit Suggestion) TypeScript demo!",
      "bright"
    )
  );
  console.log("This demo showcases the AI-powered code suggestion system.");

  try {
    // Check if Ollama is available
    const ollamaAvailable = await checkOllamaConnection();

    // Show basic API usage
    await demonstrateBasicAPI();

    // Demonstrate file processing if Ollama is available
    if (ollamaAvailable) {
      await demonstrateFileProcessing();
    } else {
      section("File Processing Demo (Skipped)");
      console.log(
        colorize(
          "⏭️  Skipping file processing demo due to Ollama connection issues",
          "yellow"
        )
      );
      console.log("");
      console.log("To run the full demo:");
      console.log("1. Start Ollama: ollama serve");
      console.log("2. Pull the model: ollama pull qwen2.5-coder:1.5b");
      console.log("3. Run this demo again");
    }

    // Show feature summary
    await showFeatureSummary();

    // Show usage instructions
    await showUsageInstructions();

    header("Demo Complete");
    console.log(colorize("🎉 Demo completed successfully!", "green"));
    console.log("");
    console.log("The NES TypeScript implementation is ready to use.");
    console.log(
      "Check out the sample files and try processing them with AI suggestions."
    );
  } catch (error) {
    console.log("");
    console.log(colorize("❌ Demo encountered an error:", "red"));
    console.error(error);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as runDemo };

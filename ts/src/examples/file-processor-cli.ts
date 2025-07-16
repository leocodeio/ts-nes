#!/usr/bin/env node
/**
 * File Processor CLI - Main example for NES (Next Edit Suggestion) system
 *
 * This example demonstrates how to process a code file (.ts or .py) and
 * apply AI-generated suggestions to create an improved output file.
 *
 * Usage:
 *   npm run build
 *   node dist/examples/file-processor-cli.js input.ts output.ts
 *   node dist/examples/file-processor-cli.js input.py output.py
 */

import { NES } from "../index";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

/**
 * CLI interface for file processing
 */
class FileProcessorCLI {
  private nes: NES;

  constructor() {
    // Initialize NES with configuration optimized for file processing
    this.nes = new NES({
      ollama: {
        model: "qwen2.5-coder:1.5b", // Use the specified model
        baseUrl: "http://localhost:11434",
        temperature: 0.1, // Low temperature for more deterministic suggestions
        timeout: 60000, // 60 second timeout for large files
      },
      contextWindow: 30, // Larger context window for better understanding
      maxSuggestions: 1, // Focus on the best single suggestion
      debug: false,
    });
  }

  /**
   * Process a single file and generate suggestions
   */
  async processFile(inputPath: string, outputPath: string): Promise<void> {
    console.log("🚀 NES File Processor");
    console.log("====================");
    console.log(`📁 Input:  ${inputPath}`);
    console.log(`📁 Output: ${outputPath}`);
    console.log("");

    try {
      // Validate input file exists
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
      }

      // Read the input file
      const originalContent = await fs.promises.readFile(inputPath, "utf-8");
      const lines = originalContent.split("\n");

      console.log(
        `📖 Loaded ${lines.length} lines from ${path.basename(inputPath)}`
      );

      // Look for cursor marker in the file, or use a strategic position
      let cursorPosition = this.findCursorPosition(originalContent);

      if (!cursorPosition) {
        // If no cursor marker found, use a position that likely needs completion
        cursorPosition = this.findOptimalCursorPosition(lines);
      }

      console.log(
        `🎯 Using cursor position: line ${cursorPosition[0] + 1}, column ${
          cursorPosition[1] + 1
        }`
      );
      console.log("🤖 Generating AI suggestions...");

      // Get suggestions from the AI model
      const result = await this.nes.getSuggestion(inputPath, cursorPosition);

      if (result.suggestions.length === 0) {
        console.log("❌ No suggestions generated");
        return;
      }

      console.log(`✅ Generated ${result.suggestions.length} suggestion(s)`);

      // Apply the best suggestion
      const bestSuggestion = result.suggestions[0];
      console.log("🔧 Applying suggestion...");
      console.log(
        `   Range: line ${bestSuggestion.textEdit.range.start.line + 1}-${
          bestSuggestion.textEdit.range.end.line + 1
        }`
      );
      console.log(
        `   Confidence: ${(bestSuggestion.confidence || 0.8) * 100}%`
      );

      // Create the output content
      const outputContent = this.applySuggestionToContent(
        originalContent,
        bestSuggestion
      );

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fs.promises.mkdir(outputDir, { recursive: true });

      // Write the output file
      await fs.promises.writeFile(outputPath, outputContent, "utf-8");

      console.log("");
      console.log("✅ File processing completed successfully!");
      console.log(`📝 Output saved to: ${outputPath}`);

      // Show diff summary
      this.showDiffSummary(originalContent, outputContent);
    } catch (error) {
      console.error(
        "❌ Error processing file:",
        error instanceof Error ? error.message : error
      );
      throw error; // Throw instead of process.exit for better testability
    }
  }

  /**
   * Find cursor marker (<|cursor|>) in the file content
   */
  private findCursorPosition(content: string): [number, number] | null {
    const lines = content.split("\n");

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const cursorIndex = line.indexOf("<|cursor|>");

      if (cursorIndex !== -1) {
        return [lineIndex, cursorIndex];
      }
    }

    return null;
  }

  /**
   * Find an optimal cursor position for generating suggestions
   */
  private findOptimalCursorPosition(lines: string[]): [number, number] {
    // Look for patterns that suggest incomplete code:
    // 1. TODO comments
    // 2. Empty functions/methods
    // 3. Incomplete class definitions
    // 4. Lines ending with incomplete syntax

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Look for TODO comments
      if (line.includes("TODO") || line.includes("FIXME")) {
        return [i, lines[i].length];
      }

      // Look for empty function bodies
      if (
        line.includes("{") &&
        i + 1 < lines.length &&
        lines[i + 1].trim() === ""
      ) {
        return [i + 1, 0];
      }

      // Look for incomplete method signatures (ending with '{')
      if (line.includes("(") && line.includes(")") && line.endsWith("{")) {
        return [i + 1, 0];
      }
    }

    // Default to middle of file
    const middleLine = Math.floor(lines.length / 2);
    return [middleLine, 0];
  }

  /**
   * Apply a text edit suggestion to content
   */
  private applySuggestionToContent(content: string, suggestion: any): string {
    const lines = content.split("\n");
    const { range, newText } = suggestion.textEdit;

    // Remove the cursor marker if present
    const cleanNewText = newText.replace("<|cursor|>", "");

    // Split into lines before, replacement, and after
    const beforeLines = lines.slice(0, range.start.line);
    const afterLines = lines.slice(range.end.line + 1);

    // Handle the replacement
    const startLine = lines[range.start.line] || "";
    const endLine = lines[range.end.line] || "";

    const beforeChar = startLine.substring(0, range.start.character);
    const afterChar = endLine.substring(range.end.character);

    // Create the modified line(s)
    const newLines = cleanNewText.split("\n");
    if (newLines.length === 1) {
      // Single line replacement
      const modifiedLine = beforeChar + newLines[0] + afterChar;
      return [...beforeLines, modifiedLine, ...afterLines].join("\n");
    } else {
      // Multi-line replacement
      const firstLine = beforeChar + newLines[0];
      const lastLine = newLines[newLines.length - 1] + afterChar;
      const middleLines = newLines.slice(1, -1);

      return [
        ...beforeLines,
        firstLine,
        ...middleLines,
        lastLine,
        ...afterLines,
      ].join("\n");
    }
  }

  /**
   * Show a summary of changes made
   */
  private showDiffSummary(original: string, modified: string): void {
    const originalLines = original.split("\n");
    const modifiedLines = modified.split("\n");

    const addedLines = modifiedLines.length - originalLines.length;

    console.log("");
    console.log("📊 Changes Summary:");
    console.log(`   Original lines: ${originalLines.length}`);
    console.log(`   Modified lines: ${modifiedLines.length}`);

    if (addedLines > 0) {
      console.log(`   ➕ Added: ${addedLines} line(s)`);
    } else if (addedLines < 0) {
      console.log(`   ➖ Removed: ${Math.abs(addedLines)} line(s)`);
    } else {
      console.log(`   🔄 Modified content (same line count)`);
    }
  }
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("Usage: node file-processor-cli.js <input-file> <output-file>");
    console.log("");
    console.log("Examples:");
    console.log(
      "  node file-processor-cli.js calculator.ts calculator_improved.ts"
    );
    console.log("  node file-processor-cli.js shapes.py shapes_improved.py");
    console.log("");
    console.log("Requirements:");
    console.log("  - Ollama must be running (ollama serve)");
    console.log(
      "  - qwen2.5-coder:1.5b model must be available (ollama pull qwen2.5-coder:1.5b)"
    );

    // Only exit if running as main module, otherwise throw for tests
    if (require.main === module) {
      process.exit(1);
    } else {
      throw new Error("Insufficient arguments provided");
    }
  }

  const [inputFile, outputFile] = args;
  const processor = new FileProcessorCLI();

  await processor.processFile(inputFile, outputFile);
}

// Run the CLI if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { FileProcessorCLI };

/**
 * File processor example for the NES system
 *
 * This example shows how to process an existing code file and generate
 * suggestions for improvements or completions.
 */

import NES from "../index";
import * as fs from "fs";
import * as path from "path";

interface ProcessOptions {
  inputFile: string;
  outputFile?: string;
  cursor?: [number, number];
  backup?: boolean;
  applyAll?: boolean;
}

async function processFile(options: ProcessOptions) {
  console.log("📁 NES File Processor");
  console.log("=====================");
  console.log(`Input file: ${options.inputFile}`);

  if (options.outputFile) {
    console.log(`Output file: ${options.outputFile}`);
  }

  try {
    // Initialize NES
    const nes = await NES.setup({
      debug: true,
      ollama: {
        model: "qwen2.5-coder:1.5b",
      },
    });

    // Validate input file exists
    if (!fs.existsSync(options.inputFile)) {
      throw new Error(`Input file not found: ${options.inputFile}`);
    }

    // Read original content
    const originalContent = await fs.promises.readFile(
      options.inputFile,
      "utf-8"
    );
    console.log(
      `📖 Read ${originalContent.split("\n").length} lines from input file`
    );

    let cursor = options.cursor;
    if (!cursor) {
      // If no cursor provided, look for cursor marker in file
      // For now, just use default cursor position
      // TODO: Implement cursor marker parsing
      const lines = originalContent.split("\n");
      cursor = [lines.length - 1, lines[lines.length - 1].length];
      console.log(`🎯 Using default cursor position: end of file`);
    }

    // Generate suggestions
    console.log("🤖 Generating suggestions...");
    const result = await nes.getSuggestion(
      options.inputFile,
      cursor,
      originalContent
    );

    console.log(`📋 Generated ${result.suggestions.length} suggestions:`);
    result.suggestions.forEach((suggestion, index) => {
      console.log(`\n${index + 1}. Suggestion ${suggestion.id}`);
      console.log(`   Confidence: ${(suggestion.confidence || 0).toFixed(2)}`);
      console.log(
        `   Range: lines ${suggestion.textEdit.range.start.line + 1}-${
          suggestion.textEdit.range.end.line + 1
        }`
      );
      console.log(
        `   Change type: ${
          suggestion.textEdit.newText ? "Addition/Replacement" : "Deletion"
        }`
      );

      if (suggestion.textEdit.newText) {
        const preview = suggestion.textEdit.newText
          .split("\n")
          .slice(0, 3)
          .map((line) => `     ${line}`)
          .join("\n");
        console.log(`   Preview:\n${preview}`);
        if (suggestion.textEdit.newText.split("\n").length > 3) {
          console.log("     ...");
        }
      }
    });

    // Apply suggestions
    const outputFile = options.outputFile || options.inputFile;

    if (options.applyAll && result.suggestions.length > 0) {
      console.log("\n✏️  Applying all suggestions...");
      const applyResults = await nes.applySuggestions(
        result.suggestions,
        outputFile,
        { backup: options.backup }
      );

      let totalLinesAffected = 0;
      let successCount = 0;

      applyResults.forEach((applyResult, index) => {
        if (applyResult.success) {
          successCount++;
          totalLinesAffected += applyResult.linesAffected;
          console.log(`   ✅ Applied suggestion ${index + 1}`);
        } else {
          console.log(
            `   ❌ Failed to apply suggestion ${index + 1}: ${
              applyResult.error
            }`
          );
        }
      });

      console.log(`\n📊 Summary:`);
      console.log(
        `   Successfully applied: ${successCount}/${result.suggestions.length} suggestions`
      );
      console.log(`   Total lines affected: ${totalLinesAffected}`);

      if (applyResults[0]?.backupPath) {
        console.log(`   Backup created: ${applyResults[0].backupPath}`);
      }
    } else if (result.suggestions.length > 0) {
      console.log("\n✏️  Applying first suggestion...");
      const applyResult = await nes.applySuggestion(
        result.suggestions[0],
        outputFile,
        { backup: options.backup }
      );

      if (applyResult.success) {
        console.log("✅ Suggestion applied successfully");
        console.log(`   Lines affected: ${applyResult.linesAffected}`);
        if (applyResult.newCursor) {
          console.log(
            `   New cursor position: line ${
              applyResult.newCursor[0] + 1
            }, column ${applyResult.newCursor[1] + 1}`
          );
        }
        if (applyResult.backupPath) {
          console.log(`   Backup created: ${applyResult.backupPath}`);
        }
      } else {
        console.error("❌ Failed to apply suggestion:", applyResult.error);
      }
    } else {
      console.log(
        "ℹ️  No suggestions generated - the code might already be optimal!"
      );
    }

    // Show final result
    if (result.suggestions.length > 0 && (options.applyAll || true)) {
      console.log("\n📄 Final file content:");
      console.log("─".repeat(60));
      const finalContent = await fs.promises.readFile(outputFile, "utf-8");
      const lines = finalContent.split("\n");
      lines.forEach((line, index) => {
        const lineNumber = (index + 1).toString().padStart(3, " ");
        console.log(`${lineNumber} │ ${line}`);
      });
      console.log("─".repeat(60));
    }

    // Clean up temp file if created
    if (options.inputFile.endsWith(".temp")) {
      await fs.promises.unlink(options.inputFile);
    }
  } catch (error) {
    console.error("❌ File processing failed:", error);
    throw error;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(
      "Usage: node file-processor.js <input-file> [output-file] [options]"
    );
    console.log("");
    console.log("Options:");
    console.log("  --cursor <line>,<col>  Set cursor position (0-based)");
    console.log("  --backup              Create backup before modifying");
    console.log(
      "  --apply-all           Apply all suggestions (default: first only)"
    );
    console.log("");
    console.log("Examples:");
    console.log("  node file-processor.js input.ts");
    console.log("  node file-processor.js input.ts output.ts --backup");
    console.log("  node file-processor.js input.py --cursor 10,5 --apply-all");
    process.exit(1);
  }

  const options: ProcessOptions = {
    inputFile: args[0],
    outputFile: args[1] && !args[1].startsWith("--") ? args[1] : undefined,
    backup: args.includes("--backup"),
    applyAll: args.includes("--apply-all"),
  };

  // Parse cursor option
  const cursorIndex = args.indexOf("--cursor");
  if (cursorIndex !== -1 && cursorIndex + 1 < args.length) {
    const cursorStr = args[cursorIndex + 1];
    const [line, col] = cursorStr.split(",").map((s) => parseInt(s.trim()));
    if (!isNaN(line) && !isNaN(col)) {
      options.cursor = [line, col];
    }
  }

  try {
    await processFile(options);
    console.log("\n🎉 File processing completed successfully!");
  } catch (error) {
    console.error("\n💥 File processing failed:", error);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main();
}

export { processFile, ProcessOptions };
export default processFile;

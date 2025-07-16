#!/usr/bin/env node

/**
 * File processing demo with diff display
 */

const { NES } = require("./dist/index");
const fs = require("fs");
const path = require("path");

async function processFileWithDiff() {
  console.log("🔄 NES File Processing Demo with Diff Display");
  console.log("==============================================\n");

  try {
    // Create NES instance with working model
    const nes = new NES({
      model: "qwen2.5-coder:1.5b",
      temperature: 0.1,
      debug: false, // Disable debug for cleaner output
    });

    // Input and output paths
    const inputFile = "sample-files/simple-calculator.ts";
    const outputFile = "output/simple-calculator-improved.ts";

    // Ensure output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    if (!fs.existsSync(inputFile)) {
      console.log("❌ Input file not found:", inputFile);
      return;
    }

    // Read original content
    console.log("📖 Original Code:");
    console.log("─".repeat(50));
    const originalContent = fs.readFileSync(inputFile, "utf8");
    console.log(originalContent);
    console.log("─".repeat(50));

    // Find cursor position (look for <|cursor|> marker)
    const lines = originalContent.split("\n");
    let cursorLine = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("<|cursor|>")) {
        cursorLine = i;
        break;
      }
    }

    if (cursorLine === -1) {
      cursorLine = Math.floor(lines.length / 2); // Default to middle
    }

    console.log(`\n🎯 Processing at cursor position: line ${cursorLine + 1}`);
    console.log("🤖 Generating AI suggestions...\n");

    // Get suggestion
    const result = await nes.getSuggestion(inputFile, [cursorLine, 0]);

    if (result.suggestions && result.suggestions.length > 0) {
      console.log(`✅ Generated ${result.suggestions.length} suggestions`);

      // Find a meaningful suggestion (not empty or just filename)
      const meaningfulSuggestion = result.suggestions.find(
        (s) =>
          s.textEdit.newText.trim().length > 10 &&
          !s.textEdit.newText.includes(inputFile) &&
          s.textEdit.newText.includes("subtract") // Look for method implementation
      );

      if (meaningfulSuggestion) {
        console.log("\n📝 Selected Suggestion:");
        console.log("─".repeat(30));
        console.log(
          "Range:",
          `lines ${meaningfulSuggestion.textEdit.range.start.line + 1}-${
            meaningfulSuggestion.textEdit.range.end.line + 1
          }`
        );
        console.log("New code:");
        console.log(meaningfulSuggestion.textEdit.newText);
        console.log("─".repeat(30));

        // Apply the suggestion
        console.log("\n🔧 Applying suggestion...");
        const applyResult = await nes.applySuggestion(meaningfulSuggestion, {
          outputPath: outputFile,
        });

        if (applyResult.success) {
          console.log("✅ Suggestion applied successfully!");

          // Read and display the improved code
          const improvedContent = fs.readFileSync(outputFile, "utf8");

          console.log("\n📄 Improved Code:");
          console.log("─".repeat(50));
          console.log(improvedContent);
          console.log("─".repeat(50));

          // Show simple diff
          console.log("\n🔍 Changes Summary:");
          console.log("─".repeat(30));
          const originalLines = originalContent.split("\n");
          const improvedLines = improvedContent.split("\n");

          console.log(`📊 Original: ${originalLines.length} lines`);
          console.log(`📊 Improved: ${improvedLines.length} lines`);
          console.log(
            `📊 Lines added: ${improvedLines.length - originalLines.length}`
          );

          // Show the new content that was added
          const range = meaningfulSuggestion.textEdit.range;
          console.log(
            `📍 Modified range: lines ${range.start.line + 1}-${
              range.end.line + 1
            }`
          );
          console.log("📝 Added content:");
          console.log(meaningfulSuggestion.textEdit.newText);

          console.log("\n✨ File processing completed successfully!");
          console.log(`📁 Original: ${inputFile}`);
          console.log(`📁 Improved: ${outputFile}`);
        } else {
          console.log("❌ Failed to apply suggestion:", applyResult.error);
        }
      } else {
        console.log("⚠️  No meaningful suggestions found");
        console.log("Available suggestions:");
        result.suggestions.forEach((s, i) => {
          console.log(
            `  ${i + 1}. Range: ${s.textEdit.range.start.line}-${
              s.textEdit.range.end.line
            }, Text: "${s.textEdit.newText.slice(0, 50)}..."`
          );
        });
      }
    } else {
      console.log("❌ No suggestions generated");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

processFileWithDiff();

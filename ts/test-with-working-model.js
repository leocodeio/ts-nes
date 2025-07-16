#!/usr/bin/env node

/**
 * Test script with explicit model configuration
 */

const { NES } = require("./dist/index");
const fs = require("fs");
const path = require("path");

async function testWithWorkingModel() {
  console.log("🧪 Testing NES with Working Model (qwen2.5-coder:1.5b)");
  console.log("=====================================================\n");

  try {
    // Create NES instance with explicit model configuration
    const nes = new NES({
      model: "qwen2.5-coder:1.5b",
      temperature: 0.1,
      debug: true,
    });

    // Test input file
    const inputFile = "sample-files/enhanced-calculator.ts";
    const outputFile = "output/test-output-working.ts";

    if (!fs.existsSync(inputFile)) {
      console.log("❌ Input file not found:", inputFile);
      return;
    }

    console.log("📖 Reading file:", inputFile);
    const content = fs.readFileSync(inputFile, "utf8");
    const lines = content.split("\n");
    console.log(`📊 File has ${lines.length} lines`);

    // Find a good cursor position (after the class declaration)
    let cursorLine = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("class") && lines[i].includes("Calculator")) {
        cursorLine = i + 2; // Position after class opening brace
        break;
      }
    }

    console.log(`🎯 Using cursor position: line ${cursorLine + 1}, column 1`);
    console.log("🤖 Generating AI suggestions...\n");

    // Get suggestion
    const result = await nes.getSuggestion(inputFile, [cursorLine, 0]);

    console.log("🔍 Result success:", result.success);
    console.log("🔍 Suggestions count:", result.suggestions.length);

    if (result.success && result.suggestions.length > 0) {
      console.log(`✅ Generated ${result.suggestions.length} suggestions`);

      // Filter for meaningful suggestions (non-empty edits)
      const meaningfulSuggestions = result.suggestions.filter(
        (s) =>
          s.textEdit.newText.trim().length > 0 &&
          s.textEdit.newText.trim() !== s.context?.filename
      );

      if (meaningfulSuggestions.length > 0) {
        const suggestion = meaningfulSuggestions[0];
        console.log("📝 First meaningful suggestion:");
        console.log(
          `   Range: line ${suggestion.textEdit.range.start.line}-${suggestion.textEdit.range.end.line}`
        );
        console.log(
          `   New text: ${suggestion.textEdit.newText.slice(0, 100)}...`
        );

        // Apply the suggestion
        console.log("\n🔧 Applying suggestion...");
        const applyResult = await nes.applySuggestion(suggestion, {
          outputPath: outputFile,
        });

        if (applyResult.success) {
          console.log("✅ Suggestion applied successfully!");
          console.log("📁 Output written to:", outputFile);

          // Show a preview of the output
          if (fs.existsSync(outputFile)) {
            const outputContent = fs.readFileSync(outputFile, "utf8");
            const outputLines = outputContent.split("\n");
            console.log(`📊 Output file has ${outputLines.length} lines`);
          }
        } else {
          console.log("❌ Failed to apply suggestion:", applyResult.error);
        }
      } else {
        console.log("⚠️  All suggestions are empty or meaningless");
        result.suggestions.forEach((s, i) => {
          console.log(`   Suggestion ${i}: "${s.textEdit.newText}"`);
        });
      }
    } else {
      console.log("❌ No valid suggestions generated");
      console.log("   Result details:", JSON.stringify(result, null, 2));
      if (!result.success) {
        console.log("   Error:", result.error);
      }
    }

    console.log("\n🎉 Test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
  }
}

// Create output directory if it doesn't exist
const outputDir = "output";
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

testWithWorkingModel();

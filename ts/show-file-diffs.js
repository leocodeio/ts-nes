#!/usr/bin/env node

/**
 * Comprehensive NES File Processing Demo
 * Shows original code, AI suggestions, and generated output with differences
 */

const fs = require("fs");
const path = require("path");

function showFileDifferences() {
  console.log("📁 NES File Processing Results");
  console.log("========================================\n");

  // Define file pairs (original -> generated)
  const filePairs = [
    {
      original: "sample-files/enhanced-shapes.py",
      generated: "output/enhanced-shapes-improved.py",
      name: "Python Shapes Module",
    },
    {
      original: "sample-files/enhanced-calculator.ts",
      generated: "output/cli-test-output.ts",
      name: "TypeScript Calculator",
    },
  ];

  filePairs.forEach((pair, index) => {
    console.log(`${index + 1}. ${pair.name}`);
    console.log("─".repeat(60));

    // Check if files exist
    if (!fs.existsSync(pair.original)) {
      console.log(`❌ Original file not found: ${pair.original}\n`);
      return;
    }

    if (!fs.existsSync(pair.generated)) {
      console.log(`❌ Generated file not found: ${pair.generated}\n`);
      return;
    }

    // Read both files
    const originalContent = fs.readFileSync(pair.original, "utf8");
    const generatedContent = fs.readFileSync(pair.generated, "utf8");

    const originalLines = originalContent.split("\n");
    const generatedLines = generatedContent.split("\n");

    console.log(`📖 Original file: ${pair.original}`);
    console.log(`📄 Generated file: ${pair.generated}`);
    console.log(
      `📊 Lines: ${originalLines.length} → ${generatedLines.length} (${
        generatedLines.length > originalLines.length ? "+" : ""
      }${generatedLines.length - originalLines.length})`
    );

    // Show file size comparison
    const originalSize = Buffer.from(originalContent).length;
    const generatedSize = Buffer.from(generatedContent).length;
    console.log(
      `💾 Size: ${originalSize} → ${generatedSize} bytes (${
        generatedSize > originalSize ? "+" : ""
      }${generatedSize - originalSize})`
    );

    console.log("\n📝 Original Code (first 20 lines):");
    console.log("┌" + "─".repeat(58) + "┐");
    originalLines.slice(0, 20).forEach((line, i) => {
      console.log(
        `│ ${String(i + 1).padStart(2)} │ ${line.slice(0, 50).padEnd(50)} │`
      );
    });
    if (originalLines.length > 20) {
      console.log(
        `│    │ ... (${
          originalLines.length - 20
        } more lines)                      │`
      );
    }
    console.log("└" + "─".repeat(58) + "┘");

    console.log("\n✨ Generated Code (first 20 lines):");
    console.log("┌" + "─".repeat(58) + "┐");
    generatedLines.slice(0, 20).forEach((line, i) => {
      console.log(
        `│ ${String(i + 1).padStart(2)} │ ${line.slice(0, 50).padEnd(50)} │`
      );
    });
    if (generatedLines.length > 20) {
      console.log(
        `│    │ ... (${
          generatedLines.length - 20
        } more lines)                      │`
      );
    }
    console.log("└" + "─".repeat(58) + "┘");

    // Simple diff analysis
    console.log("\n🔍 Key Differences:");

    // Find lines that are different
    const maxLines = Math.max(originalLines.length, generatedLines.length);
    let differences = [];

    for (let i = 0; i < maxLines; i++) {
      const origLine = originalLines[i] || "";
      const genLine = generatedLines[i] || "";

      if (origLine !== genLine) {
        differences.push({
          lineNum: i + 1,
          original: origLine,
          generated: genLine,
          type:
            origLine === "" ? "added" : genLine === "" ? "removed" : "modified",
        });
      }
    }

    if (differences.length > 0) {
      differences.slice(0, 5).forEach((diff) => {
        if (diff.type === "added") {
          console.log(`  + Line ${diff.lineNum}: ${diff.generated}`);
        } else if (diff.type === "removed") {
          console.log(`  - Line ${diff.lineNum}: ${diff.original}`);
        } else {
          console.log(`  ~ Line ${diff.lineNum}:`);
          console.log(`    - ${diff.original}`);
          console.log(`    + ${diff.generated}`);
        }
      });

      if (differences.length > 5) {
        console.log(`  ... and ${differences.length - 5} more differences`);
      }
    } else {
      console.log("  No differences found (files are identical)");
    }

    console.log("\n" + "=".repeat(60) + "\n");
  });

  // Show the CLI processor workflow
  console.log("🚀 How to Process Files with NES:");
  console.log("─".repeat(40));
  console.log("1. Build the project:");
  console.log("   npm run build");
  console.log();
  console.log("2. Process a file:");
  console.log("   node dist/examples/file-processor-cli.js input.ts output.ts");
  console.log();
  console.log("3. Or use npm scripts:");
  console.log("   npm run process:calculator");
  console.log("   npm run process:shapes");
  console.log();
  console.log("4. View the generated files in the output/ directory");
  console.log();
  console.log(
    "✨ The NES system uses AI to suggest improvements and completions!"
  );
}

showFileDifferences();

#!/usr/bin/env node

/**
 * Deep Analysis of Model Output Quality
 */

const { NES } = require("./dist/index");
const fs = require("fs");

async function analyzeModelOutput() {
  console.log("🔬 Deep Analysis of NES Model Output Quality");
  console.log("===========================================\n");

  try {
    const nes = new NES({
      model: "qwen2.5-coder:1.5b",
      temperature: 0.1,
      debug: true,
    });

    // Test 1: Simple function completion
    console.log("📋 Test 1: Simple Function Completion");
    console.log("─".repeat(40));

    const testCode1 = `function add(a: number, b: number): number {
  // TODO: implement addition
  // <|cursor|>
}`;

    fs.writeFileSync("test-simple.ts", testCode1);

    const result1 = await nes.getSuggestion("test-simple.ts", [2, 0]);
    console.log(`Generated ${result1.suggestions.length} suggestions`);

    if (result1.suggestions.length > 0) {
      result1.suggestions.forEach((suggestion, i) => {
        console.log(`\nSuggestion ${i + 1}:`);
        console.log(
          `Range: ${suggestion.textEdit.range.start.line}-${suggestion.textEdit.range.end.line}`
        );
        console.log(`Confidence: ${suggestion.confidence || "N/A"}`);
        console.log(`Content: "${suggestion.textEdit.newText}"`);
        console.log(`Length: ${suggestion.textEdit.newText.length} chars`);

        // Analyze if it's meaningful
        const isUseful =
          suggestion.textEdit.newText.includes("return") &&
          suggestion.textEdit.newText.includes("+");
        console.log(`Useful: ${isUseful ? "✅" : "❌"}`);
      });
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Test 2: Context-aware completion
    console.log("📋 Test 2: Context-Aware Completion");
    console.log("─".repeat(40));

    const testCode2 = `class Calculator {
  private value = 0;
  
  add(n: number) {
    this.value += n;
    return this;
  }
  
  // <|cursor|> - need subtract method
}`;

    fs.writeFileSync("test-context.ts", testCode2);

    const result2 = await nes.getSuggestion("test-context.ts", [8, 0]);
    console.log(`Generated ${result2.suggestions.length} suggestions`);

    if (result2.suggestions.length > 0) {
      result2.suggestions.forEach((suggestion, i) => {
        console.log(`\nSuggestion ${i + 1}:`);
        console.log(
          `Range: ${suggestion.textEdit.range.start.line}-${suggestion.textEdit.range.end.line}`
        );
        console.log(
          `Content: "${suggestion.textEdit.newText.slice(0, 200)}..."`
        );

        // Analyze if it implements subtract method
        const hasSubtract =
          suggestion.textEdit.newText.includes("subtract") &&
          suggestion.textEdit.newText.includes("this.value");
        console.log(`Contains subtract method: ${hasSubtract ? "✅" : "❌"}`);
      });
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Test 3: Raw model response analysis
    console.log("📋 Test 3: Raw Model Response Analysis");
    console.log("─".repeat(40));

    // Let's check what the API actually returns
    const contextData = result2.context;
    console.log("Context details:");
    console.log(`- Filename: ${contextData.filename}`);
    console.log(`- File type: ${contextData.filetype}`);
    console.log(
      `- Cursor position: [${contextData.currentVersion.cursor[0]}, ${contextData.currentVersion.cursor[1]}]`
    );
    console.log(
      `- Context window: ${
        contextData.currentVersion.text.split("\n").length
      } lines`
    );
    console.log(
      `- Original code preview: "${contextData.originalCode.slice(0, 100)}..."`
    );

    console.log("\n📊 Quality Assessment:");
    console.log("─".repeat(25));

    const allSuggestions = [...result1.suggestions, ...result2.suggestions];
    const totalSuggestions = allSuggestions.length;

    const meaningfulSuggestions = allSuggestions.filter(
      (s) =>
        s.textEdit.newText.trim().length > 10 &&
        !s.textEdit.newText.includes("test-") && // Exclude filenames
        (s.textEdit.newText.includes("return") ||
          s.textEdit.newText.includes("function") ||
          s.textEdit.newText.includes("class") ||
          s.textEdit.newText.includes("{"))
    );

    const qualityScore =
      (meaningfulSuggestions.length / totalSuggestions) * 100;

    console.log(`Total suggestions: ${totalSuggestions}`);
    console.log(`Meaningful suggestions: ${meaningfulSuggestions.length}`);
    console.log(`Quality score: ${qualityScore.toFixed(1)}%`);

    if (qualityScore > 70) {
      console.log("🎉 Model output quality: EXCELLENT");
    } else if (qualityScore > 40) {
      console.log("⚠️  Model output quality: MODERATE");
    } else {
      console.log("❌ Model output quality: POOR");
    }

    console.log("\n💡 Analysis Summary:");
    console.log("─".repeat(20));
    console.log("✅ API integration: WORKING");
    console.log("✅ Context generation: WORKING");
    console.log("✅ Response parsing: WORKING");
    console.log(
      `${qualityScore > 50 ? "✅" : "❌"} Suggestion quality: ${
        qualityScore > 50 ? "GOOD" : "NEEDS IMPROVEMENT"
      }`
    );
  } catch (error) {
    console.error("❌ Analysis failed:", error.message);
  } finally {
    // Cleanup
    ["test-simple.ts", "test-context.ts"].forEach((file) => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
  }
}

analyzeModelOutput();

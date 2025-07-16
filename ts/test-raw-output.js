#!/usr/bin/env node

/**
 * Raw Model Output Analysis
 */

const { NES } = require("./dist/index");
const fs = require("fs");

async function testRawModelOutput() {
  console.log("🔍 Raw Model Output Analysis");
  console.log("============================\n");

  // Create a simple test
  const testCode = `function multiply(a: number, b: number): number {
  // <|cursor|>
}`;

  fs.writeFileSync("raw-test.ts", testCode);

  try {
    // Create NES with maximum debug
    const nes = new NES({
      model: "qwen2.5-coder:1.5b",
      temperature: 0.2,
      debug: true,
    });

    console.log("📝 Test code:");
    console.log(testCode);
    console.log("\n🤖 Making API call...\n");

    // This will show us the raw response and parsing
    const result = await nes.getSuggestion("raw-test.ts", [1, 0]);

    console.log("\n📊 Result Analysis:");
    console.log(`Suggestions count: ${result.suggestions.length}`);

    result.suggestions.forEach((s, i) => {
      console.log(`\nSuggestion ${i + 1}:`);
      console.log(
        `  Range: ${s.textEdit.range.start.line}-${s.textEdit.range.end.line}`
      );
      console.log(`  Text: "${s.textEdit.newText}"`);
      console.log(`  Length: ${s.textEdit.newText.length} characters`);
      console.log(`  Confidence: ${s.confidence}`);
    });
  } catch (error) {
    console.log("\n❌ Error caught:");
    console.log(error.message);

    if (error.message.includes("missing <next-version> tag")) {
      console.log(
        "\n💡 This confirms the model is not generating the expected format!"
      );
      console.log(
        "   The qwen2.5-coder model needs different prompting or parsing."
      );
    }
  } finally {
    if (fs.existsSync("raw-test.ts")) {
      fs.unlinkSync("raw-test.ts");
    }
  }
}

testRawModelOutput();

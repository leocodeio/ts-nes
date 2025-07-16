/**
 * Integration test for the NES file processor
 * This test demonstrates the complete workflow of the system
 */

import { NES } from "../index";
import { FileProcessorCLI } from "../examples/file-processor-cli";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("NES Integration Tests", () => {
  let tempDir: string;
  let testInputFile: string;
  let testOutputFile: string;

  beforeEach(async () => {
    tempDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "nes-integration-")
    );
    testInputFile = path.join(tempDir, "test-input.ts");
    testOutputFile = path.join(tempDir, "test-output.ts");
  });

  afterEach(async () => {
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe("File Processing Workflow", () => {
    it("should process a TypeScript file with cursor marker", async () => {
      // Create a test input file with cursor marker
      const inputContent = `/**
 * Test Calculator Class
 */
export class Calculator {
  private value: number = 0;

  add(n: number): this {
    this.value += n;
    return this;
  }

  // TODO: Add subtract method
  // <|cursor|>

  getValue(): number {
    return this.value;
  }
}`;

      await fs.promises.writeFile(testInputFile, inputContent);

      // Initialize NES
      const nes = new NES({
        ollama: {
          model: "qwen2.5-coder:1.5b",
          baseUrl: "http://localhost:11434",
          timeout: 10000,
        },
        maxSuggestions: 1,
        debug: true,
      });

      // Test suggestion generation
      try {
        const result = await nes.getSuggestion(testInputFile);

        expect(result).toBeDefined();
        expect(result.suggestions).toBeInstanceOf(Array);
        expect(result.context).toBeDefined();
        expect(result.context.filename).toBe(path.resolve(testInputFile));

        console.log(`Generated ${result.suggestions.length} suggestions`);

        if (result.suggestions.length > 0) {
          const suggestion = result.suggestions[0];
          expect(suggestion.textEdit).toBeDefined();
          expect(suggestion.textEdit.range).toBeDefined();
          expect(suggestion.textEdit.newText).toBeDefined();

          console.log("First suggestion:", {
            range: suggestion.textEdit.range,
            newText: suggestion.textEdit.newText.substring(0, 100) + "...",
          });
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes("connect")) {
          console.warn(
            "⚠️ Ollama connection failed - skipping integration test"
          );
          console.warn("   Make sure Ollama is running: ollama serve");
          console.warn(
            "   And the model is available: ollama pull qwen2.5-coder:1.5b"
          );
          return;
        }
        throw error;
      }
    }, 30000); // 30 second timeout for AI processing

    it("should handle cursor position extraction correctly", async () => {
      const nes = new NES();

      const content = `line 1
line 2 with <|cursor|> marker
line 3`;

      await fs.promises.writeFile(testInputFile, content);

      // This should find the cursor marker at line 1, position 10
      const result = await nes.getSuggestion(testInputFile);
      expect(result.context.currentVersion.text).toContain("<|cursor|>");
    });
  });

  describe("File Processor CLI", () => {
    it("should handle missing input file gracefully", async () => {
      const processor = new FileProcessorCLI();
      const nonExistentFile = path.join(tempDir, "does-not-exist.ts");

      await expect(
        processor.processFile(nonExistentFile, testOutputFile)
      ).rejects.toThrow("Input file not found");
    });

    it("should create output directory if needed", async () => {
      const inputContent = `// Simple test file
console.log("hello");`;

      await fs.promises.writeFile(testInputFile, inputContent);

      const nestedOutput = path.join(tempDir, "nested", "deep", "output.ts");

      // This test might fail if Ollama is not available, which is OK
      try {
        const processor = new FileProcessorCLI();
        await processor.processFile(testInputFile, nestedOutput);

        // Check that directories were created
        expect(fs.existsSync(path.dirname(nestedOutput))).toBe(true);
      } catch (error) {
        if (error instanceof Error && error.message.includes("connect")) {
          console.warn(
            "⚠️ Skipping output directory test - Ollama not available"
          );
          return;
        }
        throw error;
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid cursor positions", async () => {
      const content = `short file`;
      await fs.promises.writeFile(testInputFile, content);

      const nes = new NES();

      // Should handle out-of-bounds cursor position gracefully
      const result = await nes.getSuggestion(testInputFile, [100, 50]);
      expect(result).toBeDefined();
    });

    it("should handle empty files", async () => {
      await fs.promises.writeFile(testInputFile, "");

      const nes = new NES();
      const result = await nes.getSuggestion(testInputFile);
      expect(result).toBeDefined();
    });
  });
});

/**
 * Manual test function for development
 * Run with: npm test -- --testNamePattern="Manual"
 */
describe("Manual Testing", () => {
  it.skip("Manual: Process sample calculator file", async () => {
    const processor = new FileProcessorCLI();
    const inputFile = path.join(
      __dirname,
      "../../sample-files/enhanced-calculator.ts"
    );
    const outputFile = path.join(
      __dirname,
      "../../output/test-calculator-output.ts"
    );

    console.log("Processing calculator file...");
    await processor.processFile(inputFile, outputFile);
    console.log("Done! Check the output file.");
  });

  it.skip("Manual: Process sample shapes file", async () => {
    const processor = new FileProcessorCLI();
    const inputFile = path.join(
      __dirname,
      "../../sample-files/enhanced-shapes.py"
    );
    const outputFile = path.join(
      __dirname,
      "../../output/test-shapes-output.py"
    );

    console.log("Processing shapes file...");
    await processor.processFile(inputFile, outputFile);
    console.log("Done! Check the output file.");
  });
});

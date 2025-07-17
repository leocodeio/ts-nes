/**
 * NES Check - One-by-one method testing for NES class
 *
 * This file provides individual test methods to verify each NES method
 * is working as expected. Run these tests manually to diagnose issues.
 */

import { NES } from "./nes";
import { NESConfig, EditSuggestion, ApplyOptions } from "./types";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * Test runner class for NES methods
 */
export class NESChecker {
  private nes: NES;
  private config: Partial<NESConfig>;
  private testDir: string;
  private tempFiles: string[] = [];

  constructor(config: Partial<NESConfig> = {}) {
    this.config = config;
    this.nes = new NES(config);
    this.testDir = path.join(os.tmpdir(), "nes-test-" + Date.now());

    // Create test directory
    if (!fs.existsSync(this.testDir)) {
      fs.mkdirSync(this.testDir, { recursive: true });
    }
  }

  /**
   * Cleanup test files after testing
   */
  cleanup(): void {
    try {
      for (const file of this.tempFiles) {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      }
      if (fs.existsSync(this.testDir)) {
        fs.rmSync(this.testDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn("⚠️ Cleanup warning:", error);
    }
  }

  /**
   * Create a temporary test file with content
   */
  private createTestFile(filename: string, content: string): string {
    const filePath = path.join(this.testDir, filename);
    fs.writeFileSync(filePath, content, "utf8");
    this.tempFiles.push(filePath);
    return filePath;
  }

  /**
   * Utility method to log test results
   */
  private logTest(testName: string, success: boolean, details?: any): void {
    const status = success ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} ${testName}`);
    if (details) {
      console.log(`   Details:`, details);
    }
    console.log("");
  }

  /**
   * Test 1: Check if NES instance is created properly
   */
  async testNESCreation(): Promise<boolean> {
    try {
      const nesConfig = this.nes.getConfig();
      const isValid = !!(
        nesConfig.ollama.baseUrl &&
        nesConfig.ollama.model &&
        nesConfig.maxSuggestions
      );

      this.logTest("NES Creation", isValid, {
        ollamaBaseUrl: nesConfig.ollama.baseUrl,
        ollamaModel: nesConfig.ollama.model,
        temperature: nesConfig.ollama.temperature,
        contextWindow: nesConfig.contextWindow,
        maxSuggestions: nesConfig.maxSuggestions,
        debug: nesConfig.debug,
      });

      return isValid;
    } catch (error) {
      this.logTest("NES Creation", false, error);
      return false;
    }
  }

  /**
   * Test 2: Test NES setup method (static)
   */
  async testNESSetup(): Promise<boolean> {
    try {
      console.log("🔧 Testing NES setup...");

      const startTime = Date.now();
      const nesInstance = await NES.setup(this.config);
      const duration = Date.now() - startTime;

      const isValid = nesInstance instanceof NES;

      this.logTest("NES Setup", isValid, {
        setupTime: `${duration}ms`,
        instanceType: nesInstance.constructor.name,
        hasConfig: !!nesInstance.getConfig(),
      });

      return isValid;
    } catch (error) {
      this.logTest("NES Setup", false, error);
      return false;
    }
  }

  /**
   * Test 3: Test health check
   */
  async testHealthCheck(): Promise<boolean> {
    try {
      console.log("🏥 Testing NES health check...");

      const startTime = Date.now();
      const health = await this.nes.healthCheck();
      const duration = Date.now() - startTime;

      const isHealthy = health.api && health.model && health.config;

      this.logTest("Health Check", isHealthy, {
        api: health.api,
        model: health.model,
        config: health.config,
        errors: health.errors,
        checkTime: `${duration}ms`,
      });

      return isHealthy;
    } catch (error) {
      this.logTest("Health Check", false, error);
      return false;
    }
  }

  /**
   * Test 4: Test debug method
   */
  async testDebugMethod(): Promise<boolean> {
    try {
      console.log("🔍 Testing NES debug method...");

      // Capture console output
      const originalLog = console.log;
      let debugOutput: string[] = [];

      console.log = (...args: any[]) => {
        debugOutput.push(args.join(" "));
        originalLog(...args);
      };

      await this.nes.debug();

      // Restore console.log
      console.log = originalLog;

      const success = debugOutput.length > 0;

      this.logTest("Debug Method", success, {
        outputLines: debugOutput.length,
        sampleOutput: debugOutput.slice(0, 3),
        hasSystemInfo: debugOutput.some(
          (line) => line.includes("NES") || line.includes("System")
        ),
      });

      return success;
    } catch (error) {
      this.logTest("Debug Method", false, error);
      return false;
    }
  }

  /**
   * Test 5: Test configuration update
   */
  async testConfigUpdate(): Promise<boolean> {
    try {
      console.log("⚙️ Testing config update...");

      const originalConfig = this.nes.getConfig();
      const newTemperature = 0.7;
      const newMaxSuggestions = 5;

      this.nes.updateConfig({
        ollama: {
          ...originalConfig.ollama,
          temperature: newTemperature,
        },
        maxSuggestions: newMaxSuggestions,
      });

      const updatedConfig = this.nes.getConfig();

      const success =
        updatedConfig.ollama.temperature === newTemperature &&
        updatedConfig.maxSuggestions === newMaxSuggestions;

      // Restore original config
      this.nes.updateConfig({
        ollama: originalConfig.ollama,
        maxSuggestions: originalConfig.maxSuggestions,
      });

      this.logTest("Config Update", success, {
        originalTemp: originalConfig.ollama.temperature,
        newTemp: newTemperature,
        originalMaxSuggestions: originalConfig.maxSuggestions,
        newMaxSuggestions: newMaxSuggestions,
        configUpdated: success,
      });

      return success;
    } catch (error) {
      this.logTest("Config Update", false, error);
      return false;
    }
  }

  /**
   * Test 6: Test getSuggestion with a simple TypeScript file
   */
  async testGetSuggestion(): Promise<boolean> {
    try {
      console.log("💡 Testing getSuggestion...");

      // Create a simple TypeScript file
      const testCode = `function add(a: number, b: number): number {
  return a + b;
}

// TODO: Add more mathematical functions
`;

      const testFile = this.createTestFile("test-suggestions.ts", testCode);

      const startTime = Date.now();
      const result = await this.nes.getSuggestion(testFile, [3, 0]); // Cursor at TODO line

      // Add detailed logging to inspect the textEdit
      console.log("=== DETAILED RESULT ANALYSIS ===");
      console.log("Full result:", JSON.stringify(result, null, 2));

      if (result?.suggestions?.[0]?.textEdit) {
        const textEdit = result.suggestions[0].textEdit;
        console.log("TextEdit range:", textEdit.range);
        console.log(
          "TextEdit newText (escaped):",
          JSON.stringify(textEdit.newText)
        );
        console.log("TextEdit newText (raw):");
        console.log("---START---");
        console.log(textEdit.newText);
        console.log("---END---");
      }

      console.log(
        "Context edits field:",
        JSON.stringify(result?.context?.edits)
      );
      console.log("================================");

      const duration = Date.now() - startTime;

      const success =
        result &&
        Array.isArray(result.suggestions) &&
        result.suggestions.length > 0 &&
        typeof result.context.filename === "string";

      this.logTest("Get Suggestion", success, {
        filename: result?.context?.filename || "N/A",
        suggestionCount: result?.suggestions?.length || 0,
        hasSuggestions: result?.suggestions && result.suggestions.length > 0,
        firstSuggestionId: result?.suggestions?.[0]?.id || "N/A",
        duration: `${duration}ms`,
        sampleSuggestion: result?.suggestions?.[0]
          ? {
              id: result.suggestions[0].id,
              confidence: result.suggestions[0].confidence,
              hasTextEdit: !!result.suggestions[0].textEdit,
              textEditRange: result.suggestions[0].textEdit?.range,
              textEditPreview:
                result.suggestions[0].textEdit?.newText?.substring(0, 100) +
                "...",
            }
          : "N/A",
      });

      return success;
    } catch (error) {
      this.logTest("Get Suggestion", false, error);
      return false;
    }
  }

  /**
   * Test 7: Test applySuggestion with a mock suggestion
   */
  async testApplySuggestion(): Promise<boolean> {
    try {
      console.log("🔧 Testing applySuggestion...");

      // Create a test file
      const originalCode = `function multiply(x, y) {
  return x * y;
}`;

      const testFile = this.createTestFile("test-apply.js", originalCode);

      // Create a mock suggestion
      const mockSuggestion: EditSuggestion = {
        id: "test-suggestion-1",
        confidence: 0.85,
        textEdit: {
          range: {
            start: { line: 0, character: 0 },
            end: { line: 2, character: 1 },
          },
          newText: `function multiply(x: number, y: number): number {
  return x * y;
}`,
        },
      };

      const options: ApplyOptions = {
        backup: true,
        validate: false,
      };

      const startTime = Date.now();
      const result = await this.nes.applySuggestion(
        mockSuggestion,
        testFile,
        options
      );
      const duration = Date.now() - startTime;

      // Read the file to verify changes
      const modifiedContent = fs.readFileSync(testFile, "utf8");
      const hasTypeAnnotations = modifiedContent.includes("number");

      const success = result.success && hasTypeAnnotations;

      this.logTest("Apply Suggestion", success, {
        applied: result.success,
        hasBackup: result.backupPath !== undefined,
        modifiedFile: testFile,
        originalLength: originalCode.length,
        modifiedLength: modifiedContent.length,
        hasTypeAnnotations,
        duration: `${duration}ms`,
        error: result.error || "None",
      });

      return success;
    } catch (error) {
      this.logTest("Apply Suggestion", false, error);
      return false;
    }
  }

  /**
   * Test 8: Test applySuggestions (multiple suggestions)
   */
  async testApplySuggestions(): Promise<boolean> {
    try {
      console.log("🔧 Testing applySuggestions (multiple)...");

      // Create a test file
      const originalCode = `var name = "John";
var age = 30;
function greet() {
  console.log("Hello " + name);
}`;

      const testFile = this.createTestFile(
        "test-apply-multiple.js",
        originalCode
      );

      // Create multiple mock suggestions
      const suggestions: EditSuggestion[] = [
        {
          id: "suggestion-1",
          confidence: 0.9,
          textEdit: {
            range: {
              start: { line: 0, character: 0 },
              end: { line: 0, character: 18 },
            },
            newText: `const name = "John";`,
          },
        },
        {
          id: "suggestion-2",
          confidence: 0.9,
          textEdit: {
            range: {
              start: { line: 1, character: 0 },
              end: { line: 1, character: 12 },
            },
            newText: `const age = 30;`,
          },
        },
        {
          id: "suggestion-3",
          confidence: 0.8,
          textEdit: {
            range: {
              start: { line: 3, character: 2 },
              end: { line: 3, character: 30 },
            },
            newText: `console.log(\`Hello \${name}\`);`,
          },
        },
      ];

      const startTime = Date.now();
      const results = await this.nes.applySuggestions(suggestions, testFile);
      const duration = Date.now() - startTime;

      // Read the file to verify changes
      const modifiedContent = fs.readFileSync(testFile, "utf8");
      const hasConst = modifiedContent.includes("const");
      const hasTemplateLiteral = modifiedContent.includes("`");

      const successCount = results.filter((r) => r.success).length;
      const success =
        successCount === suggestions.length && hasConst && hasTemplateLiteral;

      this.logTest("Apply Suggestions (Multiple)", success, {
        totalSuggestions: suggestions.length,
        successfulApplications: successCount,
        allSuccessful: successCount === suggestions.length,
        hasConst,
        hasTemplateLiteral,
        duration: `${duration}ms`,
        errors: results
          .filter((r) => !r.success)
          .map((r) => r.error)
          .filter(Boolean),
      });

      return success;
    } catch (error) {
      this.logTest("Apply Suggestions (Multiple)", false, error);
      return false;
    }
  }

  /**
   * Test 9: Test clearSuggestions
   */
  async testClearSuggestions(): Promise<boolean> {
    try {
      console.log("🧹 Testing clearSuggestions...");

      // First generate some suggestions to clear
      const testCode = `function test() {\n  // TODO: implement\n}`;
      const testFile = this.createTestFile("test-clear.ts", testCode);

      await this.nes.getSuggestion(testFile);

      // Now clear suggestions
      this.nes.clearSuggestions();

      // Test passes if clearSuggestions doesn't throw an error
      const success = true;

      this.logTest("Clear Suggestions", success, {
        message: "Clear suggestions method executed without errors",
        note: "This method clears internal cache/state",
      });

      return success;
    } catch (error) {
      this.logTest("Clear Suggestions", false, error);
      return false;
    }
  }

  /**
   * Test 10: Test end-to-end workflow
   */
  async testEndToEndWorkflow(): Promise<boolean> {
    try {
      console.log("🌍 Testing end-to-end workflow...");

      // Create a complex test file
      const testCode = `// Calculator functions
var pi = 3.14;

function calculateArea(radius) {
  return pi * radius * radius;
}

function calculateCircumference(radius) {
  return 2 * pi * radius;
}

// TODO: Add more geometric calculations
`;

      const testFile = this.createTestFile("test-e2e.js", testCode);

      const startTime = Date.now();

      // Step 1: Get suggestions
      const suggestionResult = await this.nes.getSuggestion(testFile, [10, 0]);

      // Step 2: Apply first suggestion if available
      let applyResult = null;
      if (
        suggestionResult.suggestions &&
        suggestionResult.suggestions.length > 0
      ) {
        applyResult = await this.nes.applySuggestion(
          suggestionResult.suggestions[0],
          testFile,
          { backup: true }
        );
      }

      // Step 3: Clear suggestions
      this.nes.clearSuggestions();

      const duration = Date.now() - startTime;

      const success =
        suggestionResult.suggestions.length > 0 &&
        (applyResult ? applyResult.success : true);

      this.logTest("End-to-End Workflow", success, {
        suggestionsGenerated: suggestionResult.suggestions.length,
        suggestionApplied: applyResult ? applyResult.success : "N/A",
        workflowCompleted: true,
        totalDuration: `${duration}ms`,
        steps: [
          "✓ Generated suggestions",
          applyResult
            ? applyResult.success
              ? "✓ Applied suggestion"
              : "✗ Failed to apply"
            : "- No suggestions to apply",
          "✓ Cleared cache",
        ],
      });

      return success;
    } catch (error) {
      this.logTest("End-to-End Workflow", false, error);
      return false;
    }
  }

  /**
   * Run all tests in sequence
   */
  async runAllTests(): Promise<void> {
    console.log("🚀 Starting NES Test Suite");
    console.log("=" + "=".repeat(60));
    console.log("");

    const results: { [key: string]: boolean } = {};

    try {
      // Test 1: NES Creation
      results.creation = await this.testNESCreation();

      // Test 2: NES Setup
      results.setup = await this.testNESSetup();

      // Test 3: Health Check
      results.health = await this.testHealthCheck();

      // Only proceed with other tests if basic health check passes
      if (results.health) {
        // Test 4: Debug Method
        results.debug = await this.testDebugMethod();

        // Test 5: Config Update
        results.config = await this.testConfigUpdate();

        // Test 6: Get Suggestion
        results.suggestion = await this.testGetSuggestion();

        // Test 7: Apply Suggestion
        results.applySingle = await this.testApplySuggestion();

        // Test 8: Apply Multiple Suggestions
        results.applyMultiple = await this.testApplySuggestions();

        // Test 9: Clear Suggestions
        results.clear = await this.testClearSuggestions();

        // Test 10: End-to-End Workflow
        results.e2e = await this.testEndToEndWorkflow();
      } else {
        console.log("⚠️ Skipping advanced tests due to health check failure");
        console.log(
          "💡 Please ensure Ollama is running and the model is available"
        );
      }

      // Summary
      console.log("=" + "=".repeat(60));
      console.log("📊 Test Summary:");
      console.log("");

      let passed = 0;
      let total = 0;

      for (const [testName, result] of Object.entries(results)) {
        const status = result ? "✅ PASS" : "❌ FAIL";
        console.log(`${status} ${testName}`);
        if (result) passed++;
        total++;
      }

      console.log("");
      console.log(
        `📈 Results: ${passed}/${total} tests passed (${Math.round(
          (passed / total) * 100
        )}%)`
      );

      if (passed === total) {
        console.log("🎉 All tests passed! NES is working correctly.");
      } else {
        console.log(
          "⚠️ Some tests failed. Check the details above for troubleshooting."
        );
      }
    } finally {
      // Always cleanup
      this.cleanup();
    }
  }

  /**
   * Run a specific test by name
   */
  async runTest(testName: string): Promise<boolean> {
    try {
      switch (testName.toLowerCase()) {
        case "creation":
          return await this.testNESCreation();
        case "setup":
          return await this.testNESSetup();
        case "health":
          return await this.testHealthCheck();
        case "debug":
          return await this.testDebugMethod();
        case "config":
          return await this.testConfigUpdate();
        case "suggestion":
          return await this.testGetSuggestion();
        case "applysingle":
          return await this.testApplySuggestion();
        case "applymultiple":
          return await this.testApplySuggestions();
        case "clear":
          return await this.testClearSuggestions();
        case "e2e":
          return await this.testEndToEndWorkflow();
        default:
          console.log(`❌ Unknown test: ${testName}`);
          console.log(
            "Available tests: creation, setup, health, debug, config, suggestion, applysingle, applymultiple, clear, e2e"
          );
          return false;
      }
    } finally {
      this.cleanup();
    }
  }
}

/**
 * Example usage and CLI-like interface
 */
if (require.main === module) {
  const checker = new NESChecker({
    ollama: {
      baseUrl: "http://localhost:11434",
      model: "qwen2.5-coder:1.5b",
      timeout: 30000,
      temperature: 0,
      topP: 1,
    },
    maxSuggestions: 3,
    contextWindow: 20,
    debug: false,
  });

  // Handle process cleanup
  process.on("SIGINT", () => {
    console.log("\n🧹 Cleaning up...");
    checker.cleanup();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    checker.cleanup();
    process.exit(0);
  });

  // Check command line arguments
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Run all tests
    checker.runAllTests().catch((error) => {
      console.error("Test suite failed:", error);
      checker.cleanup();
      process.exit(1);
    });
  } else {
    // Run specific test
    const testName = args[0];
    checker
      .runTest(testName)
      .then((result) => {
        process.exit(result ? 0 : 1);
      })
      .catch((error) => {
        console.error("Test failed with error:", error);
        checker.cleanup();
        process.exit(1);
      });
  }
}

export default NESChecker;

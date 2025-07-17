/**
 * API Check - One-by-one method testing for OllamaAPI
 *
 * This file provides individual test methods to verify each OllamaAPI method
 * is working as expected. Run these tests manually to diagnose issues.
 */

import { OllamaAPI } from "./api";
import { ChatMessage, OllamaConfig } from "./types";

/**
 * Test runner class for OllamaAPI methods
 */
export class APIChecker {
  private api: OllamaAPI;

  constructor(config: OllamaConfig = {}) {
    this.api = new OllamaAPI(config);
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
   * Test 1: Check if the API instance is created properly
   */
  async testAPICreation(): Promise<boolean> {
    try {
      const apiConfig = this.api.getConfig();
      const isValid = !!(
        apiConfig.baseUrl &&
        apiConfig.model &&
        apiConfig.timeout > 0
      );

      this.logTest("API Creation", isValid, {
        baseUrl: apiConfig.baseUrl,
        model: apiConfig.model,
        timeout: apiConfig.timeout,
        temperature: apiConfig.temperature,
        topP: apiConfig.topP,
      });

      return isValid;
    } catch (error) {
      this.logTest("API Creation", false, error);
      return false;
    }
  }

  /**
   * Test 2: Check if Ollama service is accessible
   */
  async testHealthCheck(): Promise<boolean> {
    try {
      console.log("🏥 Testing Ollama health check...");
      const isHealthy = await this.api.healthCheck();

      this.logTest("Health Check", isHealthy, {
        message: isHealthy
          ? "Ollama is running and accessible"
          : "Ollama is not accessible",
      });

      return isHealthy;
    } catch (error) {
      this.logTest("Health Check", false, error);
      return false;
    }
  }

  /**
   * Test 3: Get available models
   */
  async testGetAvailableModels(): Promise<boolean> {
    try {
      console.log("📋 Testing get available models...");
      const models = await this.api.getAvailableModels();
      const hasModels = Array.isArray(models) && models.length > 0;

      this.logTest("Get Available Models", hasModels, {
        modelCount: models.length,
        models: models.slice(0, 5), // Show first 5 models
        targetModelAvailable: models.includes(this.api.getConfig().model),
      });

      return hasModels;
    } catch (error) {
      this.logTest("Get Available Models", false, error);
      return false;
    }
  }

  /**
   * Test 4: Test model pulling (only if model is not available)
   */
  async testPullModel(modelName?: string): Promise<boolean> {
    try {
      const targetModel = modelName || this.api.getConfig().model;
      console.log(`📥 Testing model pull for: ${targetModel}...`);

      // First check if model exists
      const models = await this.api.getAvailableModels();
      if (models.includes(targetModel)) {
        this.logTest("Pull Model", true, {
          message: `Model ${targetModel} already exists, skipping pull`,
          action: "skipped",
        });
        return true;
      }

      // Pull the model
      await this.api.pullModel(targetModel);

      // Verify it was pulled
      const updatedModels = await this.api.getAvailableModels();
      const success = updatedModels.includes(targetModel);

      this.logTest("Pull Model", success, {
        modelName: targetModel,
        message: success ? "Model pulled successfully" : "Model pull failed",
      });

      return success;
    } catch (error) {
      this.logTest("Pull Model", false, error);
      return false;
    }
  }

  /**
   * Test 5: Test regular (non-streaming) completion
   */
  async testRegularCompletion(): Promise<boolean> {
    try {
      console.log("💬 Testing regular completion...");

      const messages: ChatMessage[] = [
        {
          role: "user",
          content: "Say 'Hello from NES API test' and nothing else.",
        },
      ];

      const startTime = Date.now();
      const response = await this.api.generateCompletion(messages, {
        stream: false,
        temperature: 0,
      });
      const duration = Date.now() - startTime;

      const success = typeof response === "string" && response.length > 0;

      this.logTest("Regular Completion", success, {
        responseLength: response.length,
        response:
          response.substring(0, 100) + (response.length > 100 ? "..." : ""),
        duration: `${duration}ms`,
        containsExpected: response.toLowerCase().includes("hello"),
      });

      return success;
    } catch (error) {
      this.logTest("Regular Completion", false, error);
      return false;
    }
  }

  /**
   * Test 6: Test streaming completion
   */
  async testStreamingCompletion(): Promise<boolean> {
    try {
      console.log("🌊 Testing streaming completion...");

      const messages: ChatMessage[] = [
        {
          role: "user",
          content: "Count from 1 to 5, one number per line.",
        },
      ];

      let chunks: string[] = [];
      let chunkCount = 0;

      const startTime = Date.now();
      const response = await this.api.generateCompletion(messages, {
        stream: true,
        temperature: 0,
        onChunk: (chunk: string) => {
          chunks.push(chunk);
          chunkCount++;
          console.log(`   Chunk ${chunkCount}: "${chunk}"`);
        },
      });
      const duration = Date.now() - startTime;

      const success =
        typeof response === "string" &&
        response.length > 0 &&
        chunkCount > 0 &&
        chunks.length > 0;

      this.logTest("Streaming Completion", success, {
        finalResponse:
          response.substring(0, 100) + (response.length > 100 ? "..." : ""),
        chunkCount,
        duration: `${duration}ms`,
        chunksReceived: chunks.length > 0,
      });

      return success;
    } catch (error) {
      this.logTest("Streaming Completion", false, error);
      return false;
    }
  }

  /**
   * Test 7: Test the call method (legacy compatibility)
   */
  async testCallMethod(): Promise<boolean> {
    try {
      console.log("📞 Testing call method...");

      const payload = {
        messages: [
          {
            role: "user" as const,
            content: "Respond with exactly 'Call method test successful'",
          },
        ],
        model: this.api.getConfig().model,
        temperature: 0,
        top_p: 1,
        stream: false,
      };

      let callbackResult = "";
      let callbackCalled = false;

      const startTime = Date.now();
      await this.api.call(payload, (output: string) => {
        callbackResult = output;
        callbackCalled = true;
      });
      const duration = Date.now() - startTime;

      const success =
        callbackCalled &&
        typeof callbackResult === "string" &&
        callbackResult.length > 0;

      this.logTest("Call Method", success, {
        callbackCalled,
        responseLength: callbackResult.length,
        response:
          callbackResult.substring(0, 100) +
          (callbackResult.length > 100 ? "..." : ""),
        duration: `${duration}ms`,
      });

      return success;
    } catch (error) {
      this.logTest("Call Method", false, error);
      return false;
    }
  }

  /**
   * Test 8: Test configuration update
   */
  async testConfigUpdate(): Promise<boolean> {
    try {
      console.log("⚙️ Testing config update...");

      const originalConfig = this.api.getConfig();
      const newTemperature = 0.5;
      const newTopP = 0.9;

      this.api.updateConfig({
        temperature: newTemperature,
        topP: newTopP,
      });

      const updatedConfig = this.api.getConfig();

      const success =
        updatedConfig.temperature === newTemperature &&
        updatedConfig.topP === newTopP &&
        updatedConfig.baseUrl === originalConfig.baseUrl;

      // Restore original config
      this.api.updateConfig({
        temperature: originalConfig.temperature,
        topP: originalConfig.topP,
      });

      this.logTest("Config Update", success, {
        originalTemp: originalConfig.temperature,
        newTemp: newTemperature,
        originalTopP: originalConfig.topP,
        newTopP: newTopP,
        configUpdated: success,
      });

      return success;
    } catch (error) {
      this.logTest("Config Update", false, error);
      return false;
    }
  }

  /**
   * Test 9: Test debug method
   */
  async testDebugMethod(): Promise<boolean> {
    try {
      console.log("🔍 Testing debug method...");

      // Capture console output
      const originalLog = console.log;
      let debugOutput: string[] = [];

      console.log = (...args: any[]) => {
        debugOutput.push(args.join(" "));
        originalLog(...args);
      };

      await this.api.debug();

      // Restore console.log
      console.log = originalLog;

      const success =
        debugOutput.length > 0 &&
        debugOutput.some((line) =>
          line.includes("NES Ollama Debug Information")
        );

      this.logTest("Debug Method", success, {
        outputLines: debugOutput.length,
        hasDebugHeader: debugOutput.some((line) =>
          line.includes("NES Ollama Debug Information")
        ),
        sampleOutput: debugOutput.slice(0, 3),
      });

      return success;
    } catch (error) {
      this.logTest("Debug Method", false, error);
      return false;
    }
  }

  /**
   * Run all tests in sequence
   */
  async runAllTests(): Promise<void> {
    console.log("🚀 Starting NES OllamaAPI Test Suite");
    console.log("=" + "=".repeat(50));
    console.log("");

    const results: { [key: string]: boolean } = {};

    // Test 1: API Creation
    results.creation = await this.testAPICreation();

    // Test 2: Health Check
    results.health = await this.testHealthCheck();

    // Only proceed with other tests if basic connectivity works
    if (results.health) {
      // Test 3: Get Available Models
      results.models = await this.testGetAvailableModels();

      // Test 4: Pull Model (if needed)
      results.pull = await this.testPullModel();

      // Test 5: Regular Completion
      results.regular = await this.testRegularCompletion();

      // Test 6: Streaming Completion
      results.streaming = await this.testStreamingCompletion();

      // Test 7: Call Method
      results.call = await this.testCallMethod();

      // Test 8: Config Update
      results.config = await this.testConfigUpdate();

      // Test 9: Debug Method
      results.debug = await this.testDebugMethod();
    } else {
      console.log("⚠️ Skipping other tests due to health check failure");
      console.log("💡 Please ensure Ollama is running: ollama serve");
    }

    // Summary
    console.log("=" + "=".repeat(50));
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
      console.log("🎉 All tests passed! NES OllamaAPI is working correctly.");
    } else {
      console.log(
        "⚠️ Some tests failed. Check the details above for troubleshooting."
      );
    }
  }

  /**
   * Run a specific test by name
   */
  async runTest(testName: string): Promise<boolean> {
    switch (testName.toLowerCase()) {
      case "creation":
        return await this.testAPICreation();
      case "health":
        return await this.testHealthCheck();
      case "models":
        return await this.testGetAvailableModels();
      case "pull":
        return await this.testPullModel();
      case "regular":
        return await this.testRegularCompletion();
      case "streaming":
        return await this.testStreamingCompletion();
      case "call":
        return await this.testCallMethod();
      case "config":
        return await this.testConfigUpdate();
      case "debug":
        return await this.testDebugMethod();
      default:
        console.log(`❌ Unknown test: ${testName}`);
        console.log(
          "Available tests: creation, health, models, pull, regular, streaming, call, config, debug"
        );
        return false;
    }
  }
}

/**
 * Example usage and CLI-like interface
 */
if (require.main === module) {
  const checker = new APIChecker({
    baseUrl: "http://localhost:11434",
    model: "qwen2.5-coder:1.5b",
    timeout: 30000,
    temperature: 0,
    topP: 1,
  });

  // Check command line arguments
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Run all tests
    checker.runAllTests().catch(console.error);
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
        process.exit(1);
      });
  }
}

export default APIChecker;

/**
 * Integration tests for the complete NES system
 */

import NES from "../index";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Mock Ollama API for testing
jest.mock("../api", () => {
  return {
    OllamaAPI: jest.fn().mockImplementation(() => ({
      healthCheck: jest.fn().mockResolvedValue(true),
      getAvailableModels: jest.fn().mockResolvedValue(["qwen2.5-coder:1.5b"]),
      pullModel: jest.fn().mockResolvedValue(undefined),
      call: jest.fn().mockImplementation((payload, callback) => {
        // Mock AI response
        const mockResponse = `<next-version>
\`\`\`typescript
// Test TypeScript file
class TestClass {
  private value: number = 0;
  
  getValue(): number {
    return this.value;
  }
  
  setValue(newValue: number): void {
    this.value = newValue;
  }
}
\`\`\`
</next-version>`;
        setTimeout(() => callback(mockResponse), 100);
      }),
      updateConfig: jest.fn(),
      debug: jest.fn(),
    })),
  };
});

describe("NES Integration Tests", () => {
  let tempDir: string;
  let testFile: string;

  beforeEach(async () => {
    tempDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "nes-integration-")
    );
    testFile = path.join(tempDir, "test.ts");
  });

  afterEach(async () => {
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe("Complete workflow", () => {
    it("should initialize, generate suggestions, and apply them", async () => {
      // Setup test file
      const originalContent = `// Test TypeScript file
class TestClass {
  private value: number = 0;
  
  getValue(): number {
    return this.value;
  }
}`;

      await fs.promises.writeFile(testFile, originalContent);

      // Initialize NES
      const nes = await NES.setup({
        debug: false,
        ollama: {
          model: "qwen2.5-coder:1.5b",
          baseUrl: "http://localhost:11434",
        },
      });

      expect(nes).toBeDefined();

      // Generate suggestions
      const result = await nes.getSuggestion(testFile, [6, 0]);

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.context.filename).toBe(path.resolve(testFile));

      // Apply first suggestion
      if (result.suggestions.length > 0) {
        const applyResult = await nes.applySuggestion(
          result.suggestions[0],
          testFile,
          { backup: true }
        );

        expect(applyResult.success).toBe(true);
        expect(applyResult.linesAffected).toBeGreaterThanOrEqual(0);
        expect(applyResult.backupPath).toBeDefined();

        // Verify backup was created
        if (applyResult.backupPath) {
          expect(fs.existsSync(applyResult.backupPath)).toBe(true);
        }

        // Verify file was modified
        const modifiedContent = await fs.promises.readFile(testFile, "utf-8");
        expect(modifiedContent).not.toBe(originalContent);
      }
    });

    it("should handle multiple suggestions", async () => {
      const content = `function incomplete() {
  // TODO: implement
}`;

      await fs.promises.writeFile(testFile, content);

      const nes = await NES.setup();
      const result = await nes.getSuggestion(testFile, [1, 20]);

      expect(result.suggestions).toBeDefined();

      if (result.suggestions.length > 1) {
        const applyResults = await nes.applySuggestions(
          result.suggestions.slice(0, 2),
          testFile
        );

        expect(applyResults).toHaveLength(2);
        applyResults.forEach((result) => {
          expect(result.success).toBe(true);
        });
      }
    });
  });

  describe("Error handling", () => {
    it("should handle non-existent files gracefully", async () => {
      const nes = await NES.setup();

      await expect(nes.getSuggestion("/non/existent/file.ts")).rejects.toThrow(
        "File not found"
      );
    });

    it("should handle invalid cursor positions", async () => {
      const content = "short file";
      await fs.promises.writeFile(testFile, content);

      const nes = await NES.setup();

      // This should not throw, cursor should be adjusted
      const result = await nes.getSuggestion(testFile, [100, 50]);
      expect(result).toBeDefined();
    });
  });

  describe("Configuration", () => {
    it("should use custom configuration", async () => {
      const customConfig = {
        debug: true,
        contextWindow: 5,
        maxSuggestions: 1,
        ollama: {
          model: "custom-model",
          baseUrl: "http://custom:11434",
          temperature: 0.5,
        },
      };

      const nes = await NES.setup(customConfig);
      const config = nes.getConfig();

      expect(config.debug).toBe(true);
      expect(config.contextWindow).toBe(5);
      expect(config.maxSuggestions).toBe(1);
      expect(config.ollama.model).toBe("custom-model");
      expect(config.ollama.baseUrl).toBe("http://custom:11434");
      expect(config.ollama.temperature).toBe(0.5);
    });

    it("should update configuration dynamically", async () => {
      const nes = await NES.setup();

      nes.updateConfig({
        debug: true,
        contextWindow: 15,
      });

      const config = nes.getConfig();
      expect(config.debug).toBe(true);
      expect(config.contextWindow).toBe(15);
    });
  });

  describe("Health check", () => {
    it("should perform comprehensive health check", async () => {
      const nes = await NES.setup();
      const health = await nes.healthCheck();

      expect(health).toHaveProperty("api");
      expect(health).toHaveProperty("model");
      expect(health).toHaveProperty("config");
      expect(health).toHaveProperty("errors");
      expect(Array.isArray(health.errors)).toBe(true);
    });
  });
});

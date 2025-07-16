/**
 * Unit tests for the NES Context Manager
 */

import { ContextManager } from "../context";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("ContextManager", () => {
  let contextManager: ContextManager;
  let tempDir: string;
  let testFile: string;

  beforeEach(async () => {
    contextManager = new ContextManager(10); // Small context window for testing
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "nes-test-"));
    testFile = path.join(tempDir, "test.ts");
  });

  afterEach(async () => {
    // Clean up temp files
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe("createContext", () => {
    it("should create context for a valid TypeScript file", async () => {
      const content = `// Test TypeScript file
class TestClass {
  private value: number = 0;
  
  getValue(): number {
    return this.value;
  }
}`;

      await fs.promises.writeFile(testFile, content);

      const context = await contextManager.createContext(testFile, [4, 10]);

      expect(context.filename).toBe(path.resolve(testFile));
      expect(context.filetype).toBe("typescript");
      expect(context.originalCode).toContain("1│// Test TypeScript file");
      expect(context.currentVersion.cursor).toEqual([4, 10]);
      expect(context.currentVersion.text).toContain("<|cursor|>");
    });

    it("should handle cursor at beginning of file", async () => {
      const content = `function test() {
  console.log('hello');
}`;

      await fs.promises.writeFile(testFile, content);

      const context = await contextManager.createContext(testFile, [0, 0]);

      expect(context.currentVersion.cursor).toEqual([0, 0]);
      expect(context.currentVersion.text).toMatch(/^<\|cursor\|>/);
    });

    it("should handle cursor at end of file", async () => {
      const content = `line1
line2
line3`;

      await fs.promises.writeFile(testFile, content);

      const context = await contextManager.createContext(testFile, [2, 5]);

      expect(context.currentVersion.cursor).toEqual([2, 5]);
      expect(context.currentVersion.text).toMatch(/<\|cursor\|>$/);
    });

    it("should throw error for non-existent file", async () => {
      await expect(
        contextManager.createContext("/non/existent/file.ts")
      ).rejects.toThrow("File not found");
    });
  });

  describe("getCurrentVersion", () => {
    it("should extract correct context window around cursor", async () => {
      const lines = Array.from({ length: 50 }, (_, i) => `line ${i + 1}`);
      const content = lines.join("\n");

      await fs.promises.writeFile(testFile, content);

      const context = await contextManager.createContext(testFile, [25, 3]);

      // Should include 10 lines before and after cursor (20 total context window)
      expect(context.currentVersion.startRow).toBe(15); // 25 - 10
      expect(context.currentVersion.endRow).toBe(35); // 25 + 10
    });

    it("should handle cursor near beginning of file", async () => {
      const content = `line1
line2
line3
line4
line5`;

      await fs.promises.writeFile(testFile, content);

      const context = await contextManager.createContext(testFile, [1, 0]);

      expect(context.currentVersion.startRow).toBe(0); // Can't go below 0
      expect(context.currentVersion.endRow).toBe(4); // 1 + 10, clamped to file end
    });
  });

  describe("createPayload", () => {
    it("should create valid chat payload", async () => {
      const content = `function test() {
  return 42;
}`;

      await fs.promises.writeFile(testFile, content);

      const context = await contextManager.createContext(testFile, [1, 5]);
      const payload = contextManager.createPayload(context);

      expect(payload.messages).toHaveLength(2);
      expect(payload.messages[0].role).toBe("system");
      expect(payload.messages[1].role).toBe("user");
      expect(payload.model).toBe("qwen2.5-coder:1.5b");
      expect(payload.temperature).toBe(0);
      expect(payload.stream).toBe(true);
    });
  });

  describe("utility methods", () => {
    it("should identify supported file types", () => {
      expect(contextManager.isFileSupported("test.ts")).toBe(true);
      expect(contextManager.isFileSupported("test.js")).toBe(true);
      expect(contextManager.isFileSupported("test.py")).toBe(true);
      expect(contextManager.isFileSupported("test.xyz")).toBe(false);
    });

    it("should parse cursor from text content", () => {
      const textWithCursor = `line1
line2 <|cursor|> more text
line3`;

      const result = ContextManager.parseCursorFromText(textWithCursor);

      expect(result.cursor).toEqual([1, 6]);
      expect(result.text).not.toContain("<|cursor|>");
      expect(result.text).toContain("line2  more text");
    });

    it("should insert cursor marker at specified position", () => {
      const text = `line1
line2
line3`;

      const result = ContextManager.insertCursorMarker(text, [1, 3]);

      expect(result).toContain("lin<|cursor|>e2");
    });

    it("should update context window size", () => {
      contextManager.setContextWindow(15);
      expect(contextManager.getContextWindow()).toBe(15);

      expect(() => contextManager.setContextWindow(0)).toThrow();
    });

    it("should update system prompt", () => {
      const newPrompt = "Custom system prompt";
      contextManager.setSystemPrompt(newPrompt);
      expect(contextManager.getSystemPrompt()).toBe(newPrompt);
    });
  });
});

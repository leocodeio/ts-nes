#!/usr/bin/env node

/**
 * Simple debug test to identify context manager issues
 */

const fs = require("fs");
const path = require("path");

// Test basic module loading
console.log("🔍 Testing module loading...");

try {
  const { ContextManager } = require("./out/context");
  console.log("✅ ContextManager loaded successfully");

  // Test instantiation
  const contextManager = new ContextManager(20);
  console.log("✅ ContextManager instantiated successfully");

  // Create a test file
  const testFilePath = path.join(__dirname, "temp", "debug-test.js");
  const testContent = `function hello() {
  console.log("Hello world");
}

function test() {
  // cursor here
}`;

  // Ensure temp directory exists
  const tempDir = path.join(__dirname, "temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  fs.writeFileSync(testFilePath, testContent);
  console.log("✅ Test file created");

  // Test context creation
  const cursor = [5, 2]; // Inside the test function
  console.log("🔍 Testing context creation...");

  contextManager
    .createContext(testFilePath, cursor)
    .then((context) => {
      console.log("✅ Context created successfully");
      console.log("Context details:");
      console.log("  - Filename:", path.basename(context.filename));
      console.log("  - File type:", context.filetype);
      console.log("  - Cursor position:", context.currentVersion.cursor);
      console.log(
        "  - Content lines:",
        context.currentVersion.content.split("\n").length
      );
      console.log(
        "  - Text with cursor:",
        context.currentVersion.text.substring(0, 100) + "..."
      );

      // Test payload creation
      console.log("🔍 Testing payload creation...");
      const payload = contextManager.createPayload(context);
      console.log("✅ Payload created successfully");
      console.log("  - Messages count:", payload.messages.length);
      console.log("  - Model:", payload.model);

      // Clean up
      fs.unlinkSync(testFilePath);
      console.log("✅ All tests passed!");
    })
    .catch((error) => {
      console.error("❌ Context creation failed:", error.message);
      console.error("Stack:", error.stack);

      // Clean up
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });
} catch (error) {
  console.error("❌ Module loading failed:", error.message);
  console.error("Stack:", error.stack);
}

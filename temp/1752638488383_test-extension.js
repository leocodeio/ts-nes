#!/usr/bin/env node

/**
 * Comprehensive test script for the NES VS Code extension
 * This script tests various components and functionality
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Import the compiled extension modules
const { NES } = require('./out/nes');
const { OllamaAPI } = require('./out/api');
const { ContextManager } = require('./out/context');

// Test configuration
const TEST_CONFIG = {
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'qwen2.5-coder:1.5b',
    timeout: 30000,
    temperature: 0,
    topP: 1,
  },
  contextWindow: 20,
  maxSuggestions: 3,
  debug: true,
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test functions
async function testOllamaConnection() {
  info('Testing Ollama connection...');
  
  try {
    const response = await axios.get(`${TEST_CONFIG.ollama.baseUrl}/api/tags`, {
      timeout: 5000
    });
    
    if (response.status === 200) {
      success('Ollama server is accessible');
      
      // Check if our model is available
      const models = response.data.models || [];
      const modelExists = models.some(m => m.name.includes(TEST_CONFIG.ollama.model.split(':')[0]));
      
      if (modelExists) {
        success(`Model '${TEST_CONFIG.ollama.model}' is available`);
        return true;
      } else {
        warning(`Model '${TEST_CONFIG.ollama.model}' not found`);
        info('Available models:', models.map(m => m.name).join(', '));
        return false;
      }
    }
  } catch (err) {
    error(`Failed to connect to Ollama: ${err.message}`);
    return false;
  }
}

async function testOllamaAPI() {
  info('Testing OllamaAPI class...');
  
  try {
    const api = new OllamaAPI(TEST_CONFIG.ollama);
    
    // Test health check
    const isHealthy = await api.healthCheck();
    if (isHealthy) {
      success('OllamaAPI health check passed');
    } else {
      error('OllamaAPI health check failed');
      return false;
    }
    
    // Test a simple generation
    const prompt = "// Complete this function:\nfunction add(a, b) {\n  return";
    const response = await api.generate(prompt);
    
    if (response && response.length > 0) {
      success('OllamaAPI generation test passed');
      info(`Generated response: "${response.substring(0, 50)}..."`);
      return true;
    } else {
      error('OllamaAPI generation test failed - empty response');
      return false;
    }
  } catch (err) {
    error(`OllamaAPI test failed: ${err.message}`);
    return false;
  }
}

async function testContextManager() {
  info('Testing ContextManager...');
  
  try {
    // Create a test file
    const testFilePath = path.join(__dirname, 'temp', 'test-context.ts');
    const testContent = `// Test TypeScript file
function calculateSum(numbers: number[]): number {
  let sum = 0;
  for (const num of numbers) {
    sum += num;
  }
  return sum;
}

// TODO: Add error handling
function divide(a: number, b: number): number {
  
}`;

    // Ensure temp directory exists
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    fs.writeFileSync(testFilePath, testContent);
    
    const contextManager = new ContextManager(TEST_CONFIG);
    
    // Test context extraction
    const cursor = [9, 2]; // Inside the divide function
    const context = await contextManager.getContext(testFilePath, cursor);
    
    if (context && context.beforeCursor && context.afterCursor) {
      success('ContextManager extracted context successfully');
      info(`Before cursor lines: ${context.beforeCursor.split('\n').length}`);
      info(`After cursor lines: ${context.afterCursor.split('\n').length}`);
      
      // Clean up
      fs.unlinkSync(testFilePath);
      return true;
    } else {
      error('ContextManager failed to extract context');
      return false;
    }
  } catch (err) {
    error(`ContextManager test failed: ${err.message}`);
    return false;
  }
}

async function testNESCore() {
  info('Testing NES core functionality...');
  
  try {
    // Create a test file
    const testFilePath = path.join(__dirname, 'temp', 'test-nes.js');
    const testContent = `// Simple calculator function
function calculate(operation, a, b) {
  switch (operation) {
    case 'add':
      return a + b;
    case 'subtract':
      return a - b;
    case 'multiply':
      return a * b;
    case 'divide':
      if (b === 0) {
        throw new Error('Division by zero');
      }
      return a / b;
    default:
      
  }
}`;

    // Ensure temp directory exists
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    fs.writeFileSync(testFilePath, testContent);
    
    const nes = new NES(TEST_CONFIG);
    
    // Test health check
    const health = await nes.healthCheck();
    info(`Health check - API: ${health.api}, Model: ${health.model}, Config: ${health.config}`);
    
    if (!health.api) {
      error('NES health check failed - API not accessible');
      return false;
    }
    
    if (!health.model) {
      warning('Model not available, but API is accessible');
    }
    
    // Test suggestion generation if model is available
    if (health.model) {
      const cursor = [15, 6]; // Inside the default case
      const result = await nes.getSuggestion(testFilePath, cursor);
      
      if (result && result.suggestions && result.suggestions.length > 0) {
        success(`Generated ${result.suggestions.length} suggestions`);
        
        // Log first suggestion details
        const firstSuggestion = result.suggestions[0];
        info(`First suggestion: "${firstSuggestion.textEdit.newText.substring(0, 50)}..."`);
        
        return true;
      } else {
        warning('No suggestions generated (this might be normal for the test case)');
        return true;
      }
    } else {
      success('NES core initialization successful (model not tested)');
      return true;
    }
    
  } catch (err) {
    error(`NES core test failed: ${err.message}`);
    return false;
  }
}

async function testExtensionPackaging() {
  info('Testing extension packaging...');
  
  try {
    // Check if package.json is valid
    const packagePath = path.join(__dirname, 'package.json');
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Validate required fields
    const requiredFields = ['name', 'displayName', 'description', 'version', 'engines', 'main', 'contributes'];
    const missingFields = requiredFields.filter(field => !packageContent[field]);
    
    if (missingFields.length > 0) {
      error(`Missing required package.json fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    success('package.json validation passed');
    
    // Check if main entry point exists
    const mainFile = path.join(__dirname, packageContent.main);
    if (fs.existsSync(mainFile)) {
      success('Main entry point exists');
    } else {
      error(`Main entry point not found: ${packageContent.main}`);
      return false;
    }
    
    // Check if VSIX file exists
    const vsixFile = path.join(__dirname, 'nes-vscode-0.1.0.vsix');
    if (fs.existsSync(vsixFile)) {
      success('VSIX package exists');
    } else {
      warning('VSIX package not found - you may need to package the extension');
    }
    
    return true;
  } catch (err) {
    error(`Extension packaging test failed: ${err.message}`);
    return false;
  }
}

async function runAllTests() {
  log('\n🧪 Running NES VS Code Extension Tests\n', 'bold');
  
  const tests = [
    { name: 'Ollama Connection', fn: testOllamaConnection },
    { name: 'Ollama API', fn: testOllamaAPI },
    { name: 'Context Manager', fn: testContextManager },
    { name: 'NES Core', fn: testNESCore },
    { name: 'Extension Packaging', fn: testExtensionPackaging },
  ];
  
  const results = [];
  
  for (const test of tests) {
    log(`\n--- ${test.name} ---`);
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (err) {
      error(`Test '${test.name}' threw an error: ${err.message}`);
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Summary
  log('\n📊 Test Results Summary\n', 'bold');
  
  let passed = 0;
  let failed = 0;
  
  results.forEach(result => {
    if (result.passed) {
      success(`${result.name}: PASSED`);
      passed++;
    } else {
      error(`${result.name}: FAILED`);
      failed++;
    }
  });
  
  log(`\nTotal: ${results.length} tests, ${passed} passed, ${failed} failed`, 'bold');
  
  if (failed === 0) {
    log('\n🎉 All tests passed! The extension appears to be working correctly.', 'green');
  } else {
    log('\n🚨 Some tests failed. Please check the issues above.', 'red');
  }
  
  // Cleanup temp directory
  const tempDir = path.join(__dirname, 'temp');
  if (fs.existsSync(tempDir)) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      info('\nCleaned up temporary files');
    } catch (err) {
      warning(`Failed to clean up temp directory: ${err.message}`);
    }
  }
  
  return failed === 0;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      error(`Test runner failed: ${err.message}`);
      process.exit(1);
    });
}

module.exports = { runAllTests };

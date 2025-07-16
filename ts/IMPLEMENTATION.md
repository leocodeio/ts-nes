# NES TypeScript Implementation Guide

## Overview

This TypeScript implementation of NES (Next Edit Suggestion) provides a complete, well-structured system for generating AI-powered code suggestions using local Ollama models. The system is designed to be simple, maintainable, and highly functional.

## Architecture

### Core Modules

1. **`types.ts`** - Complete type definitions and interfaces
2. **`api.ts`** - Ollama API client with robust error handling
3. **`context.ts`** - Context creation and prompt management
4. **`core.ts`** - Main suggestion generation and application logic
5. **`index.ts`** - Clean public API interface

### Key Features

- ✅ **Local AI Processing**: Uses Ollama with qwen2.5-coder:1.5b model
- ✅ **Cursor-based Suggestions**: Supports `<|cursor|>` markers and position-based input
- ✅ **File Processing**: Complete workflow from input file to improved output file
- ✅ **Type Safety**: Full TypeScript support with comprehensive interfaces
- ✅ **Error Handling**: Robust error handling with helpful messages
- ✅ **Abstraction**: Clean separation of concerns between modules
- ✅ **Minimal Codebase**: Simple, focused implementation
- ✅ **Testing**: Unit and integration tests included

## Usage Examples

### 1. File Processor CLI (Main Use Case)

The primary example demonstrates processing a code file with cursor markers:

```bash
# Build the project
npm run build

# Process TypeScript file with cursor marker
npm run process:calculator

# Process Python file with cursor marker
npm run process:shapes

# Or run manually:
node dist/examples/file-processor-cli.js input.ts output.ts
```

**Input file** (`enhanced-calculator.ts`):

```typescript
export class Calculator {
  add(n: number): this {
    /* ... */
  }

  // TODO: Add multiply and divide methods
  // <|cursor|>

  getValue(): number {
    /* ... */
  }
}
```

**Process**: The AI analyzes the context and generates appropriate method implementations.

**Output file**: Contains the completed methods with proper TypeScript typing.

### 2. Programmatic API

```typescript
import { NES } from "./src";

const nes = new NES({
  ollama: {
    model: "qwen2.5-coder:1.5b",
    baseUrl: "http://localhost:11434",
    temperature: 0.1,
  },
});

// Get suggestions for a file
const result = await nes.getSuggestion("myfile.ts", [10, 5]);
console.log(`Generated ${result.suggestions.length} suggestions`);

// Apply the best suggestion
if (result.suggestions.length > 0) {
  await nes.applySuggestion(result.suggestions[0], "myfile.ts", {
    createBackup: true,
  });
}
```

## Module Details

### API Module (`api.ts`)

**Purpose**: Communicate with Ollama API

- Health checks and model availability
- Streaming and non-streaming responses
- Proper error handling for connection issues
- Model pulling capabilities

**Key Methods**:

- `call(payload, callback)` - Main API interaction method
- `healthCheck()` - Verify Ollama is running
- `pullModel(modelName)` - Download required models

### Context Module (`context.ts`)

**Purpose**: Build context for AI prompts

- File analysis and language detection
- Cursor position handling and context window extraction
- Diff generation between original and current content
- Prompt template construction

**Key Methods**:

- `createContext(filePath, cursor)` - Build complete editing context
- `createPayload(context, model)` - Generate API payload

### Core Module (`core.ts`)

**Purpose**: Main suggestion logic

- Orchestrate context creation and API calls
- Parse AI responses into structured suggestions
- Apply text edits to files
- Suggestion validation and error handling

**Key Methods**:

- `getSuggestion(filePath, cursor)` - Generate suggestions
- `applySuggestion(suggestion, filePath, options)` - Apply edits
- `parseSuggestion(context, output)` - Parse AI responses

### Types Module (`types.ts`)

**Purpose**: Complete type definitions

- LSP-compatible interfaces (Position, Range, TextEdit)
- Configuration and result types
- Error handling types
- Default configurations

## Configuration

The system uses a hierarchical configuration approach:

```typescript
const config: NESConfig = {
  ollama: {
    model: "qwen2.5-coder:1.5b", // Required model
    baseUrl: "http://localhost:11434", // Ollama server
    temperature: 0.1, // Deterministic suggestions
    timeout: 30000, // 30 second timeout
  },
  contextWindow: 30, // Lines around cursor
  maxSuggestions: 1, // Focus on best suggestion
  debug: false, // Debug logging
};
```

## Error Handling

The system provides comprehensive error handling:

1. **Connection Errors**: Clear messages about Ollama availability
2. **Model Errors**: Instructions for pulling required models
3. **File Errors**: Validation of input files and permissions
4. **Parse Errors**: Graceful handling of AI response parsing
5. **Apply Errors**: Backup and rollback capabilities

## Testing

### Test Structure

```
src/__tests__/
├── context.test.ts          # Context manager tests
├── integration.test.ts      # End-to-end integration tests
└── file-processor.test.ts   # File processing workflow tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npx jest src/__tests__/context.test.ts
```

### Manual Testing

```bash
# Test with sample files (requires Ollama running)
npm run process:calculator
npm run process:shapes
```

## Development Notes

### Design Principles

1. **Simplicity**: Keep the codebase minimal and focused
2. **Modularity**: Clear separation between API, context, core, and types
3. **Type Safety**: Comprehensive TypeScript support
4. **Error Resilience**: Graceful handling of all error conditions
5. **Compatibility**: LSP-compatible data structures

### Extension Points

The system is designed for easy extension:

- **New Models**: Simply change the model name in configuration
- **New Languages**: Add file extensions to `LANGUAGE_EXTENSIONS`
- **Custom Prompts**: Override system prompts in configuration
- **New Outputs**: Extend `TextEdit` interface for different edit types

### Performance Considerations

- **Context Window**: Balanced at 30 lines for good context without overwhelming the model
- **Temperature**: Low (0.1) for deterministic, focused suggestions
- **Caching**: File content caching to avoid re-reading
- **Streaming**: Optional streaming support for real-time feedback

## Comparison with Lua Implementation

### Similarities

- Same core concept of context-driven suggestions
- Compatible prompt templates and AI interaction patterns
- Similar error handling approaches
- LSP-compatible data structures

### Improvements

- **Type Safety**: Full TypeScript support vs dynamic Lua
- **Modularity**: Better separation of concerns
- **Testing**: Comprehensive test suite
- **Documentation**: Extensive inline documentation
- **Error Handling**: More detailed error messages and recovery
- **Configuration**: Structured configuration management

### Migration Path

- Direct conceptual compatibility
- Easy to port prompts and context logic
- Similar API surface for suggestion generation and application

## Future Enhancements

1. **Multiple Suggestions**: Support for generating and managing multiple suggestions
2. **Auto-triggering**: Automatic suggestion generation on file changes
3. **IDE Integration**: VS Code extension or language server protocol
4. **Custom Models**: Support for fine-tuned models for specific use cases
5. **Suggestion Ranking**: Advanced confidence scoring and ranking algorithms

## Troubleshooting

### Common Issues

**"Cannot connect to Ollama"**

```bash
# Start Ollama service
ollama serve

# Verify it's running
curl http://localhost:11434/api/version
```

**"Model not found"**

```bash
# Pull the required model
ollama pull qwen2.5-coder:1.5b

# List available models
ollama list
```

**"TypeScript compilation errors"**

```bash
# Clean and rebuild
rm -rf dist/
npm run build
```

**"No suggestions generated"**

```bash
# Check file has cursor marker or valid content
# Verify model is responding
# Check debug logs with debug: true
```

This TypeScript implementation provides a robust, maintainable, and extensible foundation for AI-powered code suggestions while maintaining simplicity and focus on the core use case.

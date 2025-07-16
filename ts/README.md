# TypeScript Next Edit Suggestion (NES) System

A TypeScript implementation of an intelligent code suggestion system that uses local Ollama models to provide next edit suggestions for your code files.

## Features

- 🚀 **Local AI Processing**: Uses Ollama with qwen2.5-coder:1.5b model for intelligent suggestions
- 📝 **File Processing**: Supports TypeScript (.ts) and Python (.py) files
- 🎯 **Context-Aware**: Analyzes file content and cursor position for relevant suggestions
- 🔧 **Simple API**: Clean and minimal interface for easy integration
- 🧪 **Well Tested**: Comprehensive test suite with examples

## Requirements

Before using NES-TS, you need to have Ollama installed and running:

1. **Install Ollama**: Visit [ollama.ai](https://ollama.ai/) and follow the installation instructions for your platform.

2. **Start Ollama service**:

   ```bash
   ollama serve
   ```

3. **Pull the required model**:
   ```bash
   ollama pull qwen2.5-coder:1.5b
   ```

## 📦 Installation

```bash
npm install nes-ts
```

Or for development:

```bash
git clone https://github.com/your-username/nes-ts.git
cd nes-ts
npm install
npm run build
```

## 🚀 Quick Start

### File Processing Example (Main Use Case)

The primary use case is processing a code file and generating an improved version:

```bash
# Build the project
npm run build

# Process TypeScript files
npm run process:calculator
npm run process:shapes

# Or run manually:
node dist/examples/file-processor-cli.js input.ts output.ts
node dist/examples/file-processor-cli.js input.py output.py
```

This will:

1. Read your input file (e.g., `enhanced-calculator.ts`)
2. Look for a cursor marker `<|cursor|>` or find an optimal position
3. Generate AI suggestions using qwen2.5-coder:1.5b
4. Apply the best suggestion
5. Save the improved code to the output file

### Basic Programmatic Usage

```typescript
import { NES } from "./src";

async function example() {
  // Initialize the NES system
  const nes = await NES.setup({
    ollama: {
      model: "qwen2.5-coder:1.5b",
      baseUrl: "http://localhost:11434",
    },
    debug: true,
  });

  // Generate suggestions for a file at cursor position
  const result = await nes.getSuggestion(
    "./src/myfile.ts",
    [10, 5] // line 10, column 5 (0-based)
  );

  console.log(`Generated ${result.suggestions.length} suggestions`);

  // Apply the first suggestion
  if (result.suggestions.length > 0) {
    const applyResult = await nes.applySuggestion(
      result.suggestions[0],
      "./src/myfile.ts",
      { backup: true }
    );

    if (applyResult.success) {
      console.log("Suggestion applied successfully!");
    }
  }
}
```

### Working with Cursor Markers

NES-TS supports cursor markers (`<|cursor|>`) in your source files for precise positioning:

```typescript
// File content with cursor marker
const code = `
function calculateSum(numbers: number[]): number {
  let total = 0;
  for (const num of numbers) {
    total += num;
  }
  // <|cursor|>
  return total;
}
`;

// The system will automatically detect and use the cursor position
const result = await nes.getSuggestion("./file-with-cursor.ts");
```

## 📖 API Reference

### NES Class

#### `NES.setup(config?: Partial<NESConfig>): Promise<NES>`

Initializes the NES system with configuration and performs health checks.

```typescript
const nes = await NES.setup({
  ollama: {
    model: "qwen2.5-coder:1.5b",
    baseUrl: "http://localhost:11434",
    timeout: 30000,
    temperature: 0,
    topP: 1,
  },
  contextWindow: 20,
  maxSuggestions: 5,
  debug: false,
});
```

#### `getSuggestion(filePath: string, cursor?: [number, number], originalContent?: string): Promise<SuggestionResult>`

Generates edit suggestions for a file.

- `filePath`: Path to the file to analyze
- `cursor`: Optional cursor position [line, column] (0-based)
- `originalContent`: Optional original content for diff comparison

#### `applySuggestion(suggestion: EditSuggestion, filePath: string, options?: ApplyOptions): Promise<ApplyResult>`

Applies a single suggestion to a file.

```typescript
const applyResult = await nes.applySuggestion(suggestion, "./file.ts", {
  backup: true, // Create backup before applying
  validate: true, // Validate syntax after applying
  trigger: false, // Don't auto-trigger next suggestion
});
```

#### `applySuggestions(suggestions: EditSuggestion[], filePath: string, options?: ApplyOptions): Promise<ApplyResult[]>`

Applies multiple suggestions in sequence.

#### `healthCheck(): Promise<HealthCheckResult>`

Performs a comprehensive health check of the system.

### Configuration Types

```typescript
interface NESConfig {
  ollama: {
    baseUrl?: string; // Default: 'http://localhost:11434'
    model?: string; // Default: 'qwen2.5-coder:1.5b'
    timeout?: number; // Default: 30000
    temperature?: number; // Default: 0
    topP?: number; // Default: 1
  };
  contextWindow?: number; // Default: 20
  maxSuggestions?: number; // Default: 5
  debug?: boolean; // Default: false
  systemPrompt?: string; // Custom system prompt
  ignorePatterns?: string[]; // File patterns to ignore
}
```

## 🛠️ CLI Tools

### File Processor

Process individual files and apply suggestions:

```bash
# Basic usage
node dist/examples/file-processor.js input.ts

# Specify output file
node dist/examples/file-processor.js input.ts output.ts

# Create backup and apply all suggestions
node dist/examples/file-processor.js input.py --backup --apply-all

# Set specific cursor position
node dist/examples/file-processor.js input.js --cursor 15,10
```

### Basic Example

Run the basic example to see NES-TS in action:

```bash
npm run example
```

## 📁 Project Structure

```
ts/
├── src/
│   ├── __tests__/           # Unit and integration tests
│   ├── examples/            # Example applications
│   │   ├── basic.ts         # Basic usage example
│   │   └── file-processor.ts # File processing CLI
│   ├── types.ts             # TypeScript type definitions
│   ├── api.ts               # Ollama API client
│   ├── context.ts           # Context management
│   ├── core.ts              # Core suggestion logic
│   └── index.ts             # Main entry point
├── dist/                    # Compiled JavaScript
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx jest src/__tests__/context.test.ts

# Generate coverage report
npm test -- --coverage
```

## 🎯 Supported Languages

NES-TS supports a wide range of programming languages:

| Extension | Language   | Extension | Language |
| --------- | ---------- | --------- | -------- |
| `.ts`     | TypeScript | `.py`     | Python   |
| `.js`     | JavaScript | `.java`   | Java     |
| `.cpp`    | C++        | `.go`     | Go       |
| `.c`      | C          | `.rs`     | Rust     |
| `.php`    | PHP        | `.rb`     | Ruby     |
| `.swift`  | Swift      | `.kt`     | Kotlin   |
| `.scala`  | Scala      | `.lua`    | Lua      |
| `.sh`     | Bash       | `.sql`    | SQL      |

## 🔍 How It Works

1. **Context Analysis**: Extracts the current editing context around the cursor position
2. **History Tracking**: Analyzes recent file changes to understand editing patterns
3. **AI Processing**: Sends context to local Ollama model for intelligent suggestions
4. **Response Parsing**: Parses AI response into structured text edits
5. **Application**: Applies suggestions with precise range-based edits

## 🐛 Troubleshooting

### Common Issues

**❌ "Cannot connect to Ollama"**

```bash
# Ensure Ollama is running
ollama serve
```

**❌ "Model not found"**

```bash
# Pull the required model
ollama pull qwen2.5-coder:1.5b
```

**❌ "No suggestions generated"**

- The code might already be optimal
- Try adjusting cursor position
- Check if file type is supported

### Debug Mode

Enable debug mode for detailed logging:

```typescript
const nes = await NES.setup({ debug: true });
await nes.debug(); // Print system information
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📋 Roadmap

- [ ] **Multi-model Support**: Support for additional Ollama models
- [ ] **Editor Integrations**: VS Code, Vim, Emacs plugins
- [ ] **Configuration Profiles**: Predefined configurations for different languages
- [ ] **Batch Processing**: Process multiple files in one command
- [ ] **Streaming Suggestions**: Real-time suggestion updates
- [ ] **Custom Prompts**: User-defined prompt templates
- [ ] **Metrics & Analytics**: Usage statistics and performance metrics

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original [nes.nvim](https://github.com/Xuyuanp/nes.nvim) project by Xuyuanp
- [Ollama](https://ollama.ai/) for providing local AI infrastructure
- The TypeScript and Node.js communities

## 📞 Support

- 📖 [Documentation](https://github.com/your-username/nes-ts/wiki)
- 🐛 [Issue Tracker](https://github.com/your-username/nes-ts/issues)
- 💬 [Discussions](https://github.com/your-username/nes-ts/discussions)
- 📧 [Email Support](mailto:support@example.com)

---

**Made with ❤️ by the NES-TS team**

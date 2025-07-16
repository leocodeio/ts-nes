# NES VS Code Extension

This is the VS Code extension for NES (Next Edit Suggestion), an AI-powered code completion system using local Ollama models.

## Features

- **AI-Powered Code Suggestions**: Get intelligent edit suggestions powered by local Ollama models
- **Multiple Language Support**: Works with TypeScript, JavaScript, Python, Java, C++, Go, and Rust
- **Local Processing**: All suggestions are generated locally using Ollama
- **Customizable Models**: Configure which Ollama model to use
- **Context-Aware**: Understands your current code context and recent edits
- **Manual and Auto-Apply**: Choose when to apply suggestions

## Quick Start

### Prerequisites

1. **Install Ollama** (visit https://ollama.ai):

   ```bash
   # On macOS:
   brew install ollama

   # On Linux:
   curl -fsSL https://ollama.ai/install.sh | sh

   # On Windows: Download from https://ollama.ai/download
   ```

2. **Start Ollama and pull a model**:

   ```bash
   ollama serve &
   ollama pull qwen2.5-coder:1.5b
   ```

3. **Install the extension** (see Installation section below)

### Installation and Setup

#### Method 1: Install from VSIX (Recommended)

1. **Build the extension** (if you haven't already):

   ```bash
   cd /path/to/nes.nvim/ts-vs-plugin
   npm install
   npm run compile
   npm install -g vsce
   vsce package
   ```

2. **Install the generated VSIX**:
   ```bash
   code --install-extension nes-vscode-0.1.0.vsix
   ```

#### Method 2: Development Mode

1. **Open the extension folder in VS Code**:

   ```bash
   cd /path/to/nes.nvim/ts-vs-plugin
   code .
   ```

2. **Press F5** to open Extension Development Host with the extension loaded

### Quick Test

1. **Open a TypeScript/JavaScript file** in VS Code
2. **Position your cursor** where you want a suggestion
3. **Press `Ctrl+Shift+N`** (or `Cmd+Shift+N` on Mac)
4. **Wait for the suggestion** to appear
5. **Apply it** with Command Palette → "NES: Apply Suggestion"

## Usage

### Commands

Access via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command                         | Shortcut       | Description                   |
| ------------------------------- | -------------- | ----------------------------- |
| **NES: Get AI Code Suggestion** | `Ctrl+Shift+N` | Generate suggestion at cursor |
| **NES: Apply Suggestion**       | -              | Apply the current suggestion  |
| **NES: Open Settings**          | -              | Open NES configuration        |
| **NES: Health Check**           | -              | Verify Ollama setup           |

### Context Menu

Right-click in any supported file → "Get AI Code Suggestion"

### Status Bar

The NES status appears in the bottom-right status bar:

- `$(lightbulb) NES: Ready` - Ready for suggestions
- `$(lightbulb) NES: Thinking...` - Generating suggestion
- `$(lightbulb) NES: Error` - Check Output panel for details

## Configuration

Configure via VS Code Settings (`Ctrl+,` → search "nes"):

```json
{
  "nes.ollama.baseUrl": "http://localhost:11434",
  "nes.ollama.model": "qwen2.5-coder:1.5b",
  "nes.ollama.timeout": 30000,
  "nes.ollama.temperature": 0,
  "nes.contextWindow": 20,
  "nes.maxSuggestions": 5,
  "nes.debug": false,
  "nes.autoApply": false
}
```

### Key Settings

- **nes.ollama.model**: Try these models:

  - `qwen2.5-coder:1.5b` (fast, good for most code)
  - `qwen2.5-coder:7b` (slower, better quality)
  - `codellama:7b` (good alternative)
  - `deepseek-coder:6.7b` (excellent for complex code)

- **nes.contextWindow**: Lines around cursor (10-50 recommended)
- **nes.debug**: Enable to see detailed logs in Output panel

## Supported Languages

✅ TypeScript  
✅ JavaScript  
✅ Python  
✅ Java  
✅ C++  
✅ Go  
✅ Rust

## Development

### Building from Source

```bash
# Clone and setup
git clone <repository-url>
cd ts-vs-plugin

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package extension
npm install -g vsce
vsce package
```

### Development Workflow

1. **Open in VS Code**: `code .`
2. **Press F5** to launch Extension Development Host
3. **Make changes** and **Ctrl+Shift+F5** to reload
4. **Check Output panel** (select "NES" channel) for logs

## Troubleshooting

### 1. "Ollama not responding"

**Check Ollama status**:

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it
ollama serve
```

**Verify model**:

```bash
ollama list
# If model missing:
ollama pull qwen2.5-coder:1.5b
```

### 2. "No suggestions generated"

- ✅ **Position cursor** in middle of code (not at end of file)
- ✅ **Check file type** is supported
- ✅ **Enable debug mode** and check Output panel
- ✅ **Try different model** in settings

### 3. Extension not working

**Check VS Code version**: Requires VS Code 1.74.0+

**Enable debug logs**:

1. Settings → search "nes" → enable "Debug"
2. View → Output → select "NES" channel
3. Try generating a suggestion
4. Review logs for errors

**Run Health Check**:

1. Command Palette → "NES: Health Check"
2. Review results

### 4. Slow suggestions

- Try smaller model: `qwen2.5-coder:1.5b`
- Reduce context window: set to 10-15 lines
- Check Ollama performance: `ollama ps`

## Example Workflow

1. **Open a JavaScript file**:

   ```javascript
   function calculateTotal(items) {
     // Position cursor here and press Ctrl+Shift+N
   }
   ```

2. **Press `Ctrl+Shift+N`** → NES generates:

   ```javascript
   function calculateTotal(items) {
     return items.reduce((sum, item) => sum + item.price, 0);
   }
   ```

3. **Apply with Command Palette** → "NES: Apply Suggestion"

## Performance Tips

- **Use smaller models** for faster responses
- **Adjust context window** based on file size
- **Enable auto-apply** for rapid development
- **Use keyboard shortcuts** for faster workflow

## License

MIT License - see LICENSE file for details.

---

🚀 **Enjoy AI-powered coding with NES!**

## 🚀 Features

- **AI-Powered Suggestions**: Get intelligent code suggestions using local Ollama models
- **Multiple Languages**: Supports TypeScript, JavaScript, Python, Java, C++, Go, Rust, and more
- **Context-Aware**: Analyzes your code context to provide relevant suggestions
- **Local Processing**: All AI processing happens locally using Ollama
- **Customizable**: Configurable model parameters and behavior
- **Easy to Use**: Simple keyboard shortcuts and command palette integration

## 📋 Prerequisites

Before using the NES VS Code extension, you need to set up Ollama:

### 1. Install Ollama

Visit [ollama.ai](https://ollama.ai/) and follow the installation instructions for your platform.

### 2. Start Ollama Service

```bash
ollama serve
```

### 3. Pull the Required Model

```bash
ollama pull qwen2.5-coder:1.5b
```

## 🔧 Installation & Setup

### Development Setup

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd ts-vs-plugin
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Compile the extension**:

   ```bash
   npm run compile
   ```

4. **Open in VS Code**:

   ```bash
   code .
   ```

5. **Run the extension**:
   - Press `F5` or go to `Run and Debug` view
   - Select "Run Extension" configuration
   - Click the play button

This will open a new VS Code window with the extension loaded.

### Package the Extension (Optional)

To create a `.vsix` file for distribution:

1. **Install vsce** (if not already installed):

   ```bash
   npm install -g vsce
   ```

2. **Package the extension**:

   ```bash
   vsce package
   ```

3. **Install the packaged extension**:
   ```bash
   code --install-extension nes-vscode-0.1.0.vsix
   ```

## 🎯 Usage

### Quick Start

1. **Open a code file** (TypeScript, JavaScript, Python, etc.)
2. **Position your cursor** where you want suggestions
3. **Trigger suggestions** using one of these methods:
   - Press `Ctrl+Shift+N` (Windows/Linux) or `Cmd+Shift+N` (Mac)
   - Right-click and select "Get AI Code Suggestion"
   - Open Command Palette (`Ctrl+Shift+P`) and run "NES: Get AI Code Suggestion"

### Available Commands

| Command                       | Shortcut       | Description                                         |
| ----------------------------- | -------------- | --------------------------------------------------- |
| `NES: Get AI Code Suggestion` | `Ctrl+Shift+N` | Generate AI suggestions for current cursor position |
| `NES: Apply Suggestion`       | -              | Apply the last generated suggestion                 |
| `NES: Health Check`           | -              | Check Ollama connection and model availability      |
| `NES: Open Settings`          | -              | Open NES configuration settings                     |

### Example Workflow

1. **Open a TypeScript file** with some code:

   ```typescript
   function calculateSum(numbers: number[]): number {
     let total = 0;
     // Place cursor here and request suggestion
   }
   ```

2. **Press `Ctrl+Shift+N`** to get suggestions

3. **Select a suggestion** from the quick pick menu

4. **The suggestion is applied** automatically to your code

## ⚙️ Configuration

Configure the extension through VS Code settings (`Ctrl+,` and search for "NES"):

### Ollama Settings

| Setting                  | Default                  | Description                  |
| ------------------------ | ------------------------ | ---------------------------- |
| `nes.ollama.baseUrl`     | `http://localhost:11434` | Ollama API base URL          |
| `nes.ollama.model`       | `qwen2.5-coder:1.5b`     | Model to use for suggestions |
| `nes.ollama.timeout`     | `30000`                  | Request timeout (ms)         |
| `nes.ollama.temperature` | `0`                      | Model temperature (0-1)      |

### Behavior Settings

| Setting              | Default | Description                     |
| -------------------- | ------- | ------------------------------- |
| `nes.contextWindow`  | `20`    | Lines of context around cursor  |
| `nes.maxSuggestions` | `5`     | Maximum suggestions to generate |
| `nes.debug`          | `false` | Enable debug logging            |
| `nes.autoApply`      | `false` | Auto-apply first suggestion     |

### Example Configuration

Add this to your VS Code `settings.json`:

```json
{
  "nes.ollama.model": "qwen2.5-coder:1.5b",
  "nes.contextWindow": 25,
  "nes.maxSuggestions": 3,
  "nes.debug": true
}
```

## 🔍 Testing the Extension

### 1. Verify Ollama Setup

```bash
# Check if Ollama is running
curl http://localhost:11434/api/version

# Check if model is available
ollama list | grep qwen2.5-coder
```

### 2. Test in VS Code

1. **Open the extension development host** (F5)
2. **Open a test file**:
   ```typescript
   // Create a new TypeScript file with this content
   class Calculator {
     add(a: number, b: number): number {
       // Place cursor here and test
     }
   }
   ```
3. **Test the health check**:

   - Open Command Palette (`Ctrl+Shift+P`)
   - Run "NES: Health Check"
   - Should show ✅ for API, Model, and Config

4. **Test suggestion generation**:
   - Place cursor inside the `add` method
   - Press `Ctrl+Shift+N`
   - Should see suggestion options in a quick pick menu

### 3. Check Extension Output

- Open **Output** panel (`Ctrl+Shift+U`)
- Select **NES** from the dropdown
- View logs and debug information

### 4. Status Bar

Look for the NES status in the bottom-right status bar:

- `$(lightbulb) NES: Ready` - Extension is working
- `$(lightbulb) NES: Failed` - Something went wrong

## 🐛 Troubleshooting

### Common Issues

#### ❌ "Cannot connect to Ollama"

**Solution**:

```bash
# Start Ollama service
ollama serve

# Verify it's running
curl http://localhost:11434/api/version
```

#### ❌ "Model not found"

**Solution**:

```bash
# Pull the required model
ollama pull qwen2.5-coder:1.5b

# Verify it's available
ollama list
```

#### ❌ "No suggestions generated"

**Possible causes**:

- Code might already be optimal
- Cursor position might not be suitable
- Model might need different context

**Solution**:

- Try moving cursor to a different position
- Check debug output in NES output channel
- Verify model is responding with health check

#### ❌ Extension not loading

**Solution**:

1. Check VS Code Developer Console (`Help > Toggle Developer Tools`)
2. Look for error messages
3. Ensure all dependencies are installed: `npm install`
4. Recompile: `npm run compile`

### Debug Mode

Enable debug mode for detailed logging:

1. Open VS Code settings
2. Search for "nes.debug"
3. Enable the setting
4. Check the NES output channel for detailed logs

### Manual Testing

Test the underlying NES module directly:

```bash
# Go to the parent ts directory
cd ../ts

# Build the project
npm run build

# Test with a sample file
npm run process:calculator
```

## 📁 Project Structure

```
ts-vs-plugin/
├── src/
│   ├── extension.ts          # Main extension entry point
│   ├── nes.ts               # NES module (copied from ../ts/src/index.ts)
│   ├── api.ts               # Ollama API client
│   ├── context.ts           # Context management
│   ├── core.ts              # Core suggestion logic
│   └── types.ts             # TypeScript type definitions
├── .vscode/
│   ├── launch.json          # Debug configuration
│   ├── tasks.json           # Build tasks
│   └── extensions.json      # Recommended extensions
├── out/                     # Compiled JavaScript output
├── package.json             # Extension manifest and dependencies
├── tsconfig.json            # TypeScript configuration
└── README.md               # This file
```

## 🚧 Development

### Building

```bash
# Compile TypeScript
npm run compile

# Watch for changes
npm run watch
```

### Running

```bash
# Run extension in development mode
# Press F5 in VS Code or use the debug configuration
```

### Testing Changes

1. Make code changes
2. Recompile (`npm run compile`)
3. Reload the extension development host (`Ctrl+R` in the extension host window)

## 🎨 Customization

### Adding New Languages

Edit `package.json` to add more language support:

```json
"activationEvents": [
    "onLanguage:newlanguage"
],
"contributes": {
    // Add to completion provider in extension.ts
}
```

### Custom Prompts

Modify the system prompt in `context.ts` or add user-configurable prompts in `package.json` configuration.

### UI Customization

The extension uses VS Code's native UI components:

- QuickPick for suggestion selection
- Status bar for status display
- Output channel for logging
- Configuration for settings

## 📊 Performance

### Optimization Tips

1. **Reduce context window** for faster processing
2. **Lower max suggestions** for quicker responses
3. **Use smaller models** if available
4. **Enable streaming** for real-time feedback

### Benchmarks

Typical performance with `qwen2.5-coder:1.5b`:

- Suggestion generation: 2-5 seconds
- Context processing: <100ms
- Memory usage: ~50MB

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.

## 🙏 Acknowledgments

- Original [nes.nvim](https://github.com/Xuyuanp/nes.nvim) project
- [Ollama](https://ollama.ai/) for local AI infrastructure
- VS Code Extension API team

---

**Happy coding with AI assistance! 🚀**

# NES VS Code Extension - Setup and Testing Guide

This guide will walk you through setting up and testing the NES (Next Edit Suggestion) VS Code extension step by step.

## 🚀 Complete Setup Guide

### Step 1: Install Prerequisites

#### Install Ollama

**On Linux:**

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**On macOS:**

```bash
brew install ollama
```

**On Windows:**
Download from https://ollama.ai/download

#### Start Ollama Service

```bash
# Start Ollama (run in background)
ollama serve &

# Or start in foreground
ollama serve
```

#### Download AI Model

```bash
# Download the recommended model (1.5GB)
ollama pull qwen2.5-coder:1.5b

# Alternative smaller/faster model
ollama pull qwen2.5-coder:0.5b

# Alternative larger/better model
ollama pull qwen2.5-coder:7b
```

#### Verify Ollama Setup

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# List available models
ollama list

# Test model
ollama run qwen2.5-coder:1.5b "Write a hello world function in JavaScript"
```

### Step 2: Install the VS Code Extension

#### Option A: Install Pre-built VSIX (Recommended)

1. **Locate the VSIX file**:

   ```bash
   ls /media/leo/leostore/leostore/leo-ext/self/other/opensource/nes.nvim/ts-vs-plugin/nes-vscode-0.1.0.vsix
   ```

2. **Install via command line**:

   ```bash
   code --install-extension /media/leo/leostore/leostore/leo-ext/self/other/opensource/nes.nvim/ts-vs-plugin/nes-vscode-0.1.0.vsix
   ```

3. **Or install via VS Code UI**:
   - Open VS Code
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Extensions: Install from VSIX..."
   - Navigate to and select `nes-vscode-0.1.0.vsix`

#### Option B: Development Mode

1. **Open extension folder in VS Code**:

   ```bash
   cd /media/leo/leostore/leostore/leo-ext/self/other/opensource/nes.nvim/ts-vs-plugin
   code .
   ```

2. **Press F5** to launch Extension Development Host

### Step 3: Configure the Extension

1. **Open VS Code Settings**:

   - Press `Ctrl+,` (or `Cmd+,` on Mac)
   - Search for "nes"

2. **Key settings to verify**:
   ```json
   {
     "nes.ollama.baseUrl": "http://localhost:11434",
     "nes.ollama.model": "qwen2.5-coder:1.5b",
     "nes.debug": true
   }
   ```

## 🧪 Testing the Extension

### Test 1: Health Check

1. **Open Command Palette**: `Ctrl+Shift+P`
2. **Run**: "NES: Health Check"
3. **Expected result**: All checkmarks ✅

### Test 2: Basic JavaScript Suggestion

1. **Create new JavaScript file**: `test.js`
2. **Type this code**:
   ```javascript
   function calculateSum(numbers) {
     // Position cursor here and press Ctrl+Shift+N
   }
   ```
3. **Position cursor** after the `//` comment
4. **Press `Ctrl+Shift+N`** (or `Cmd+Shift+N` on Mac)
5. **Wait for suggestion** (check status bar)
6. **Apply suggestion**: Command Palette → "NES: Apply Suggestion"

### Test 3: TypeScript Suggestion

1. **Create new TypeScript file**: `test.ts`
2. **Type this code**:

   ```typescript
   interface User {
     name: string;
     email: string;
   }

   function validateUser(user: User): boolean {
     // Position cursor here and press Ctrl+Shift+N
   }
   ```

3. **Generate and apply suggestion**

### Test 4: Python Suggestion

1. **Create new Python file**: `test.py`
2. **Type this code**:
   ```python
   def fibonacci(n):
       # Position cursor here and press Ctrl+Shift+N
   ```
3. **Generate and apply suggestion**

## 📊 Monitoring and Debugging

### Check Extension Logs

1. **Open Output Panel**: `View` → `Output`
2. **Select "NES" from dropdown**
3. **Enable debug mode**: Settings → search "nes" → enable "Debug"
4. **Try generating suggestion** and watch logs

### Common Log Messages

✅ **Success logs**:

```
[timestamp] Initializing NES with configuration: {...}
[timestamp] NES initialized successfully
[timestamp] Generating suggestion for file: test.js
[timestamp] Suggestion generated successfully
```

❌ **Error logs**:

```
[timestamp] ERROR: Failed to connect to Ollama
[timestamp] ERROR: Model not found: qwen2.5-coder:1.5b
[timestamp] ERROR: Timeout waiting for response
```

### Status Bar Indicators

- `$(lightbulb) NES: Ready` - Extension loaded and ready
- `$(lightbulb) NES: Thinking...` - Generating suggestion
- `$(lightbulb) NES: Error` - Check Output panel

## 🔧 Troubleshooting

### Issue 1: "Extension not activated"

**Check**: VS Code version (requires 1.74.0+)

```bash
code --version
```

**Check**: Extension is installed

```bash
code --list-extensions | grep nes
```

### Issue 2: "Ollama not responding"

**Check**: Ollama service is running

```bash
ps aux | grep ollama
curl http://localhost:11434/api/tags
```

**Fix**: Start Ollama

```bash
ollama serve
```

### Issue 3: "Model not found"

**Check**: Model is downloaded

```bash
ollama list
```

**Fix**: Download model

```bash
ollama pull qwen2.5-coder:1.5b
```

### Issue 4: "No suggestions generated"

**Check**:

- ✅ Cursor position (not at end of file)
- ✅ File type is supported
- ✅ Enable debug logs and check Output panel
- ✅ Try smaller context window (10-15 lines)

### Issue 5: "Slow responses"

**Optimize**:

- Use smaller model: `qwen2.5-coder:0.5b`
- Reduce context window to 10-15 lines
- Check system resources: `htop` or `top`

## 🎯 Usage Tips

### Best Practices

1. **Position cursor thoughtfully**: Place cursor where you want code to be inserted
2. **Provide context**: Write comments describing what you want
3. **Use appropriate file types**: Extension works best with supported languages
4. **Start with simple examples**: Test basic functions before complex code

### Optimal Settings

**For fast responses**:

```json
{
  "nes.ollama.model": "qwen2.5-coder:0.5b",
  "nes.contextWindow": 10,
  "nes.ollama.temperature": 0
}
```

**For better quality**:

```json
{
  "nes.ollama.model": "qwen2.5-coder:7b",
  "nes.contextWindow": 30,
  "nes.ollama.temperature": 0.1
}
```

### Example Test Cases

**JavaScript Array Processing**:

```javascript
const numbers = [1, 2, 3, 4, 5];
const result = numbers.
// Press Ctrl+Shift+N here
```

**TypeScript Interface Implementation**:

```typescript
interface Calculator {
  add(a: number, b: number): number;
  subtract(a: number, b: number): number;
}

class BasicCalculator implements Calculator {
  // Press Ctrl+Shift+N here
}
```

**Python Class Definition**:

```python
class BankAccount:
    def __init__(self, initial_balance):
        # Press Ctrl+Shift+N here
```

## 📈 Performance Monitoring

### Check Model Performance

```bash
# Monitor Ollama processes
ollama ps

# Check system resources
htop

# Test model speed
time ollama run qwen2.5-coder:1.5b "write a function"
```

### Benchmark Settings

Test different configurations and measure response times:

1. **Model size**: 0.5b vs 1.5b vs 7b
2. **Context window**: 10 vs 20 vs 50 lines
3. **Temperature**: 0 vs 0.1 vs 0.2

## 🎉 Success Indicators

You'll know the extension is working correctly when:

✅ Health check shows all green checkmarks  
✅ Status bar shows "NES: Ready"  
✅ Ctrl+Shift+N generates suggestions within 5-10 seconds  
✅ Applied suggestions are syntactically correct  
✅ Debug logs show successful API calls

## 📞 Support

If you encounter issues:

1. **Check this guide first**
2. **Enable debug logging** and review Output panel
3. **Run health check** command
4. **Test with simple examples** before complex code
5. **Verify Ollama setup** independently

Happy coding with AI assistance! 🚀

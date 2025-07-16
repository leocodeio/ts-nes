#!/bin/bash

# NES VS Code Extension - Installation and Testing Script

echo "🚀 NES VS Code Extension Setup Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check if we're in the right directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
EXTENSION_DIR="/media/leo/leostore/leostore/leo-ext/self/other/opensource/nes.nvim/ts-vs-plugin"

print_header "Step 1: Checking Prerequisites"

# Check VS Code
if command -v code &> /dev/null; then
    VS_CODE_VERSION=$(code --version | head -1)
    print_status "VS Code found: $VS_CODE_VERSION"
else
    print_error "VS Code not found. Please install VS Code first."
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js first."
    exit 1
fi

# Check Ollama
if command -v ollama &> /dev/null; then
    print_status "Ollama found"
    
    # Check if Ollama is running
    if curl -s http://localhost:11434/api/tags &> /dev/null; then
        print_status "Ollama service is running"
        
        # Check for required model
        if ollama list | grep -q "qwen2.5-coder:1.5b"; then
            print_status "Model qwen2.5-coder:1.5b is available"
        else
            print_warning "Model qwen2.5-coder:1.5b not found"
            read -p "Would you like to download it now? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_status "Downloading model qwen2.5-coder:1.5b..."
                ollama pull qwen2.5-coder:1.5b
            else
                print_warning "You can download it later with: ollama pull qwen2.5-coder:1.5b"
            fi
        fi
    else
        print_warning "Ollama service not running. Start it with: ollama serve"
    fi
else
    print_error "Ollama not found. Please install Ollama from https://ollama.ai"
    exit 1
fi

print_header "Step 2: Checking Extension Files"

# Check if extension directory exists
if [ -d "$EXTENSION_DIR" ]; then
    print_status "Extension directory found"
    cd "$EXTENSION_DIR"
    
    # Check if VSIX file exists
    if [ -f "nes-vscode-0.1.0.vsix" ]; then
        print_status "VSIX package found: nes-vscode-0.1.0.vsix"
    else
        print_warning "VSIX package not found. Building extension..."
        
        # Build the extension
        if [ -f "package.json" ]; then
            print_status "Installing dependencies..."
            npm install
            
            print_status "Compiling TypeScript..."
            npm run compile
            
            print_status "Installing VSCE..."
            npm install -g vsce
            
            print_status "Packaging extension..."
            vsce package --allow-missing-repository --no-license
            
            if [ -f "nes-vscode-0.1.0.vsix" ]; then
                print_status "Extension packaged successfully!"
            else
                print_error "Failed to package extension"
                exit 1
            fi
        else
            print_error "package.json not found in extension directory"
            exit 1
        fi
    fi
else
    print_error "Extension directory not found: $EXTENSION_DIR"
    exit 1
fi

print_header "Step 3: Installing Extension"

# Check if extension is already installed
if code --list-extensions | grep -q "nes-team.nes-vscode"; then
    print_warning "Extension appears to be already installed"
    read -p "Would you like to reinstall it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Uninstalling previous version..."
        code --uninstall-extension nes-team.nes-vscode
    else
        print_status "Skipping installation"
        exit 0
    fi
fi

# Install the extension
print_status "Installing NES VS Code Extension..."
if code --install-extension nes-vscode-0.1.0.vsix; then
    print_status "Extension installed successfully!"
else
    print_error "Failed to install extension"
    exit 1
fi

print_header "Step 4: Testing Installation"

# Create a test file
TEST_FILE="/tmp/nes-test.js"
cat > "$TEST_FILE" << 'EOF'
function calculateSum(numbers) {
    // Position cursor here and press Ctrl+Shift+N
}

function fibonacci(n) {
    // Press Ctrl+Shift+N for AI suggestion
}
EOF

print_status "Created test file: $TEST_FILE"

print_header "🎉 Installation Complete!"
echo
print_status "Next steps:"
echo "1. Open VS Code: code $TEST_FILE"
echo "2. Position cursor after a comment"
echo "3. Press Ctrl+Shift+N (or Cmd+Shift+N on Mac)"
echo "4. Wait for AI suggestion"
echo "5. Apply with Command Palette → 'NES: Apply Suggestion'"
echo
print_status "Configuration:"
echo "  - Press Ctrl+, and search for 'nes' to configure"
echo "  - Enable debug mode to see logs: View → Output → NES"
echo
print_status "Health Check:"
echo "  - Command Palette → 'NES: Health Check'"
echo
print_warning "Make sure Ollama is running: ollama serve"
echo

print_header "📚 Documentation"
echo "  - Setup Guide: $EXTENSION_DIR/SETUP_GUIDE.md"
echo "  - README: $EXTENSION_DIR/README.md"
echo

echo "🚀 Happy coding with AI assistance!"

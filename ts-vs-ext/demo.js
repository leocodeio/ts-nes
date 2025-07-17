// NES VS Code Extension Demo File
// Use this file to test the AI-powered code suggestions

// Test 1: Simple function implementation
function calculateSum(numbers) {
  // Position cursor here and press Ctrl+Shift+N
  // Expected: AI should suggest array.reduce() implementation
}

// Test 2: Async function with error handling
async function fetchUserData(userId) {
  // Position cursor here and press Ctrl+Shift+N
  // Expected: AI should suggest try-catch with fetch
}

// Test 3: Class method implementation
class Calculator {
  constructor() {
    this.history = [];
  }

  add(a, b) {
    // Position cursor here and press Ctrl+Shift+N
    // Expected: AI should suggest implementation with history
  }

  getHistory() {
    // Position cursor here and press Ctrl+Shift+N
  }
}

// Test 4: Array manipulation
const users = [
  { name: "Alice", age: 30, active: true },
  { name: "Bob", age: 25, active: false },
  { name: "Charlie", age: 35, active: true },
];

// Get active users
const activeUsers = users;
// Position cursor here and press Ctrl+Shift+N
// Expected: AI should suggest .filter() method

// Test 5: Promise chain
function processData(data) {
  return Promise.resolve(data)
    .then
    // Position cursor here and press Ctrl+Shift+N
    ();
}

// Test 6: Simple validation function
function validateUser(user) {
  // Position cursor here and press Ctrl+Shift+N
  // Expected: AI should suggest validation logic for user object
  
}

/* 
TESTING INSTRUCTIONS:
1. Position your cursor after any comment marked for suggestions
2. Press Ctrl+Shift+N (Cmd+Shift+N on Mac)
3. Wait for the suggestion (watch status bar)
4. Review the suggestion
5. Apply it using Command Palette → "NES: Apply Suggestion"

TROUBLESHOOTING:
- If no suggestions appear, check Output panel (View → Output → NES)
- Make sure Ollama is running: ollama serve
- Try the Health Check: Command Palette → "NES: Health Check"
- Enable debug mode in settings for detailed logs
*/

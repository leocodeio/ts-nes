// NES VS Code Extension TypeScript Demo File
// Use this file to test AI-powered code suggestions with TypeScript

// Test 1: Interface implementation
interface User {
    id: number;
    name: string;
    email: string;
    active: boolean;
}

class UserService {
    private users: User[] = [];
    
    addUser(user: User): void {
        // Position cursor here and press Ctrl+Shift+N
        // Expected: AI should suggest validation and array push
    }
    
    findUserById(id: number): User | undefined {
        // Position cursor here and press Ctrl+Shift+N
        // Expected: AI should suggest array.find() method
        
    }
}

// Test 2: Generic function
function processArray<T>(items: T[], processor: (item: T) => T): T[] {
    // Position cursor here and press Ctrl+Shift+N
    // Expected: AI should suggest map() implementation
}

// Test 3: Promise with types
async function fetchData<T>(url: string): Promise<T> {
    // Position cursor here and press Ctrl+Shift+N
    // Expected: AI should suggest fetch with try-catch and typing
}

// Test 4: Type guards
function isString(value: unknown): value is string {
    // Position cursor here and press Ctrl+Shift+N
    // Expected: AI should suggest typeof check
}

// Test 5: Enum usage
enum Status {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

function handleStatus(status: Status): string {
    // Position cursor here and press Ctrl+Shift+N
    // Expected: AI should suggest switch statement
}

// Test 6: Complex type definitions
type ApiResponse<T> = {
    data: T;
    success: boolean;
    message?: string;
}

function processApiResponse<T>(response: ApiResponse<T>): T | null {
    // Position cursor here and press Ctrl+Shift+N
    // Expected: AI should suggest conditional logic
}

/* 
TESTING INSTRUCTIONS:
1. Position your cursor after any comment marked for suggestions
2. Press Ctrl+Shift+N (Cmd+Shift+N on Mac)
3. Wait for the suggestion (watch status bar)
4. Review the TypeScript-aware suggestion
5. Apply it using Command Palette → "NES: Apply Suggestion"

TYPESCRIPT FEATURES TO TEST:
- Type annotations
- Interface implementations
- Generic functions
- Type guards
- Enum handling
- Complex type definitions
*/

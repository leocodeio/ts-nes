/**
 * Core types and interfaces for the NES (Next Edit Suggestion) system
 *
 * This module defines all the essential types used throughout the NES system,
 * providing strong typing for better development experience and runtime safety.
 */

/**
 * Represents a position in a text document (line and character)
 * Compatible with LSP Position interface
 */
/** Line position in a document (zero-based) */
/** Character offset on a line in a document (zero-based) */
export interface Position {
  line: number;
  character: number;
}

/**
 * Represents a range in a text document expressed as (start, end) positions
 * Compatible with LSP Range interface
 */
/** The range's start position */
/** The range's end position */
export interface Range {
  start: Position;
  end: Position;
}

/**
 * Represents a text edit operation to be applied to a document
 * Compatible with LSP TextEdit interface
 */
/** The range of the text document to be manipulated */
/** The new text for the range */
export interface TextEdit {
  range: Range;
  newText: string;
}

/**
 * Configuration for Ollama API connection
 */
/** Base URL for Ollama API (default: http://localhost:11434) */
/** Model name to use (default: qwen2.5-coder:1.5b) */
/** Request timeout in milliseconds (default: 30000) */
/** Temperature for model generation (0-1, default: 0) */
/** Top-p for model generation (0-1, default: 1) */
export interface OllamaConfig {
  baseUrl?: string;
  model?: string;
  timeout?: number;
  temperature?: number;
  topP?: number;
}

/**
 * Represents the current editing context around the cursor
 */
/** Current cursor position */
/** Start row of the context window */
/** End row of the context window */
/** Text content with cursor marker (<|cursor|>) */
/** Raw content without cursor marker for convenience */
export interface CurrentVersion {
  cursor: [number, number];
  startRow: number;
  endRow: number;
  text: string;
  content: string;
}

/**
 * Contains all context information needed for generating suggestions
 */
/** Path to the file being edited */
/** File type/language (e.g., 'typescript', 'python') */
/** Original file content with line numbers */
/** Diff string showing recent edits */
/** Current version context around cursor */
export interface EditContext {
  filename: string;
  filetype: string;
  originalCode: string;
  edits: string;
  currentVersion: CurrentVersion;
}

/**
 * Payload structure for Ollama API requests
 */
export interface ChatPayload {
  /** Array of chat messages */
  messages: ChatMessage[];
  /** Model name to use */
  model: string;
  /** Temperature setting */
  temperature: number;
  /** Top-p setting */
  top_p: number;
  /** Whether to stream the response */
  stream: boolean;
  /** Additional options */
  options?: Record<string, any>;
}

/**
 * Individual chat message
 */
export interface ChatMessage {
  /** Role of the message sender */
  role: "system" | "user" | "assistant";
  /** Content of the message */
  content: string;
}

/**
 * Single edit suggestion with associated text edit
 */
export interface EditSuggestion {
  /** The text edit operation */
  textEdit: TextEdit;
  /** Unique identifier for this suggestion */
  id: string;
  /** Confidence score (0-1) */
  confidence?: number;
}

/**
 * Collection of edit suggestions for a file
 */
export interface SuggestionResult {
  /** Array of suggested edits */
  suggestions: EditSuggestion[];
  /** Context used to generate suggestions */
  context: EditContext;
  /** Timestamp when suggestions were generated */
  timestamp: number;
}

/**
 * Options for applying suggestions
 */
export interface ApplyOptions {
  /** Whether to auto-trigger next suggestion after applying */
  trigger?: boolean;
  /** Whether to create backup before applying */
  backup?: boolean;
  /** Whether to validate syntax after applying */
  validate?: boolean;
}

/**
 * Result of applying a suggestion
 */
export interface ApplyResult {
  /** Whether the application was successful */
  success: boolean;
  /** Number of lines affected */
  linesAffected: number;
  /** New cursor position after application */
  newCursor?: [number, number];
  /** Error message if application failed */
  error?: string;
  /** Path to backup file if created */
  backupPath?: string;
}

/**
 * Configuration for the NES system
 */
export interface NESConfig {
  /** Ollama configuration */
  ollama: OllamaConfig;
  /** Context window size (lines before/after cursor) */
  contextWindow?: number;
  /** Maximum number of suggestions to generate */
  maxSuggestions?: number;
  /** Whether to enable debug logging */
  debug?: boolean;
  /** Custom system prompt override */
  systemPrompt?: string;
  /** File patterns to ignore */
  ignorePatterns?: string[];
}

/**
 * Events emitted by the NES system
 */
export interface NESEvents {
  /** Emitted when suggestions are generated */
  "suggestions-generated": (result: SuggestionResult) => void;
  /** Emitted when a suggestion is applied */
  "suggestion-applied": (result: ApplyResult) => void;
  /** Emitted when an error occurs */
  error: (error: Error) => void;
  /** Emitted for debug information */
  debug: (message: string, data?: any) => void;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Required<NESConfig> = {
  ollama: {
    baseUrl: "http://localhost:11434",
    model: "qwen2.5-coder:1.5b",
    timeout: 30000,
    temperature: 0,
    topP: 1,
  },
  contextWindow: 20,
  maxSuggestions: 5,
  debug: false,
  systemPrompt: "", // Will be set to default in context.ts
  ignorePatterns: [
    "*.log",
    "*.tmp",
    "node_modules/**",
    ".git/**",
    "dist/**",
    "build/**",
  ],
};

/**
 * Language file extensions mapping
 */
export const LANGUAGE_EXTENSIONS: Record<string, string> = {
  ".ts": "typescript",
  ".js": "javascript",
  ".py": "python",
  ".java": "java",
  ".cpp": "cpp",
  ".c": "c",
  ".go": "go",
  ".rs": "rust",
  ".php": "php",
  ".rb": "ruby",
  ".swift": "swift",
  ".kt": "kotlin",
  ".scala": "scala",
  ".lua": "lua",
  ".sh": "bash",
  ".sql": "sql",
  ".html": "html",
  ".css": "css",
  ".scss": "scss",
  ".json": "json",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".xml": "xml",
  ".md": "markdown",
  ".txt": "text",
};

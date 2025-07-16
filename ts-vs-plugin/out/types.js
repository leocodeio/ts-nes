"use strict";
/**
 * Core types and interfaces for the NES (Next Edit Suggestion) system
 *
 * This module defines all the essential types used throughout the NES system,
 * providing strong typing for better development experience and runtime safety.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LANGUAGE_EXTENSIONS = exports.DEFAULT_CONFIG = void 0;
/**
 * Default configuration values
 */
exports.DEFAULT_CONFIG = {
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
exports.LANGUAGE_EXTENSIONS = {
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
//# sourceMappingURL=types.js.map
/**
 * Context management for the NES (Next Edit Suggestion) system
 *
 * This module handles the creation and management of editing context,
 * including file analysis, diff generation, and prompt construction.
 */

import * as fs from "fs";
import * as path from "path";
import { diffLines as createDiff } from "diff";
import {
  EditContext,
  CurrentVersion,
  ChatMessage,
  ChatPayload,
  LANGUAGE_EXTENSIONS,
} from "./types";

/**
 * Default system prompt for the AI model
 * Guides the model to provide focused, contextual code suggestions
 */
const DEFAULT_SYSTEM_PROMPT = `
You are an expert software engineer. The user will provide:
- Recently viewed files and edits
- A code snippet with current context
- The cursor position marked as "<|cursor|>"

Your goals:
1. Detect incorrect, missing, or suboptimal code.
2. Propose **only the minimal necessary change**, not full rewrites.
3. Show context with ellipses ("…") and include changed or added lines only.
4. Preserve existing logic, formatting, method signatures, and return types.
5. Keep the "<|cursor|>" marker exactly where it is.
6. Apply all specified modifications (e.g., new methods, parameters, calls).
7. Respond in a terse, impersonal tone without explanations.
8. Provide a copy‑paste‑ready snippet wrapped exactly as:
<next-version>
…your updated code…
</next-version>
`.trim();

/**
 * Template for user prompts sent to the AI model
 */
const USER_PROMPT_TEMPLATE = `
These are the files I'm working on, before I started making changes to them:
<original_code>
%s:
%s
</original_code>

This is a sequence of edits that I made on these files, starting from the oldest to the newest:
<edits_to_original_code>
\`\`\`
---%s:
+++%s:
%s
\`\`\`
</edits_to_original_code>

Here is the piece of code I am currently editing in %s:

<current-version>
\`\`\`%s
%s
\`\`\`
</current-version>

Based on my most recent edits, what will I do next? Rewrite the code between <current-version> and </current-version> based on
what I will do next. Do not skip any lines. Do not be lazy.
`.trim();

/**
 * Context manager for creating and maintaining edit contexts
 */
export class ContextManager {
  private contextWindow: number;
  private systemPrompt: string;

  constructor(contextWindow: number = 20, systemPrompt?: string) {
    this.contextWindow = contextWindow;
    this.systemPrompt = systemPrompt || DEFAULT_SYSTEM_PROMPT;
  }

  /**
   * Create edit context from a file path and optional cursor position
   */
  async createContext(
    filePath: string,
    cursor?: [number, number],
    originalContent?: string
  ): Promise<EditContext> {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Read current file content
    const currentContent = await fs.promises.readFile(filePath, "utf-8");
    const currentLines = currentContent.split("\n");

    // Get original content (either provided or same as current)
    const originalLines = originalContent
      ? originalContent.split("\n")
      : currentLines;

    // Determine file type from extension
    const ext = path.extname(filePath).toLowerCase();
    const filetype = LANGUAGE_EXTENSIONS[ext] || "text";

    // Set default cursor position if not provided (middle of file)
    const defaultCursor: [number, number] = cursor || [
      Math.floor(currentLines.length / 2),
      0,
    ];

    // Create current version context around cursor
    const currentVersion = this.getCurrentVersion(currentLines, defaultCursor);

    // Generate original code with line numbers
    const originalCode = this.formatCodeWithLineNumbers(originalLines);

    // Generate diff between original and current
    const edits = this.generateDiff(originalLines.join("\n"), currentContent);

    return {
      filename: path.resolve(filePath),
      filetype,
      originalCode,
      edits,
      currentVersion,
    };
  }

  /**
   * Extract current version context around the cursor position
   */
  private getCurrentVersion(
    lines: string[],
    cursor: [number, number]
  ): CurrentVersion {
    const [row, col] = cursor;

    // Calculate context window boundaries
    const startRow = Math.max(0, row - this.contextWindow);
    const endRow = Math.min(lines.length - 1, row + this.contextWindow);

    // Extract lines before cursor
    const beforeCursor = lines.slice(startRow, row);
    const currentLine = lines[row] || "";
    const beforeCursorOnLine = currentLine.slice(0, col);
    const afterCursorOnLine = currentLine.slice(col);

    // Extract lines after cursor
    const afterCursor = lines.slice(row + 1, endRow + 1);

    // Combine with cursor marker
    const beforeText = [...beforeCursor, beforeCursorOnLine].join("\n");
    const afterText = [afterCursorOnLine, ...afterCursor].join("\n");
    const text = `${beforeText}<|cursor|>${afterText}`;

    return {
      cursor,
      startRow,
      endRow,
      text,
      content: text.replace("<|cursor|>", ""), // Content without cursor marker
    };
  }

  /**
   * Format code with line numbers for better context
   */
  private formatCodeWithLineNumbers(lines: string[]): string {
    return lines
      .map(
        (line, index) => `${(index + 1).toString().padStart(3, " ")}│${line}`
      )
      .join("\n");
  }

  /**
   * Generate unified diff between original and current content
   */
  private generateDiff(original: string, current: string): string {
    const diff = createDiff(original, current, {
      ignoreWhitespace: false,
      newlineIsToken: true,
    });

    const diffOutputLines: string[] = [];

    for (const part of diff) {
      const lines = part.value.split("\n");
      if (part.added) {
        lines.forEach((line: string) => {
          if (line.trim()) diffOutputLines.push(`+${line}`);
        });
      } else if (part.removed) {
        lines.forEach((line: string) => {
          if (line.trim()) diffOutputLines.push(`-${line}`);
        });
      } else {
        // Context lines (unchanged)
        lines.forEach((line: string) => {
          if (line.trim()) diffOutputLines.push(` ${line}`);
        });
      }
    }

    return diffOutputLines.join("\n");
  }

  /**
   * Create chat payload for the AI model
   */
  createPayload(
    context: EditContext,
    model: string = "qwen2.5-coder:1.5b"
  ): ChatPayload {
    const userContent = this.formatUserPrompt(context);

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: this.systemPrompt,
      },
      {
        role: "user",
        content: userContent,
      },
    ];

    return {
      messages,
      model,
      temperature: 0,
      top_p: 1,
      stream: true,
    };
  }

  /**
   * Format the user prompt using the template
   */
  private formatUserPrompt(context: EditContext): string {
    // Use the more reliable createUserPrompt method
    return this.createUserPrompt(context);
  }

  /**
   * Create user prompt with proper string formatting
   */
  private createUserPrompt(context: EditContext): string {
    // Using simple string replacement for template
    let prompt = USER_PROMPT_TEMPLATE;

    const replacements = [
      context.filename,
      context.originalCode,
      context.filename,
      context.filename,
      context.edits,
      context.filename,
      context.filetype,
      context.currentVersion.text,
    ];

    // Replace %s placeholders in order
    replacements.forEach((replacement) => {
      prompt = prompt.replace("%s", replacement);
    });

    return prompt;
  }

  /**
   * Update the system prompt
   */
  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }

  /**
   * Get the current system prompt
   */
  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  /**
   * Update the context window size
   */
  setContextWindow(size: number): void {
    if (size < 1) {
      throw new Error("Context window size must be at least 1");
    }
    this.contextWindow = size;
  }

  /**
   * Get the current context window size
   */
  getContextWindow(): number {
    return this.contextWindow;
  }

  /**
   * Validate if a file is supported for context creation
   */
  isFileSupported(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext in LANGUAGE_EXTENSIONS;
  }

  /**
   * Get supported file extensions
   */
  getSupportedExtensions(): string[] {
    return Object.keys(LANGUAGE_EXTENSIONS);
  }

  /**
   * Parse cursor position from text content
   * Useful when working with editor integrations
   */
  static parseCursorFromText(text: string): {
    text: string;
    cursor: [number, number];
  } {
    const lines = text.split("\n");
    let cursor: [number, number] = [0, 0];
    let cleanText = text;

    // Find cursor marker
    for (let row = 0; row < lines.length; row++) {
      const line = lines[row];
      const cursorIndex = line.indexOf("<|cursor|>");

      if (cursorIndex !== -1) {
        cursor = [row, cursorIndex];
        // Remove cursor marker from text
        lines[row] = line.replace("<|cursor|>", "");
        cleanText = lines.join("\n");
        break;
      }
    }

    return { text: cleanText, cursor };
  }

  /**
   * Insert cursor marker at specified position
   */
  static insertCursorMarker(text: string, cursor: [number, number]): string {
    const lines = text.split("\n");
    const [row, col] = cursor;

    if (row < lines.length) {
      const line = lines[row];
      lines[row] = line.slice(0, col) + "<|cursor|>" + line.slice(col);
    }

    return lines.join("\n");
  }
}

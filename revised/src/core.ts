/**
 * Core logic for the NES (Next Edit Suggestion) system
 *
 * This module contains the main suggestion generation, parsing, and application logic.
 * It orchestrates the context creation, API calls, and text editing operations.
 */

import * as fs from "fs";
import * as path from "path";
import { diffLines as createDiff } from "diff";
import { OllamaAPI } from "./api";
import { ContextManager } from "./context";
import {
  EditContext,
  EditSuggestion,
  SuggestionResult,
  ApplyResult,
  ApplyOptions,
  TextEdit,
  Range,
  Position,
  NESConfig,
  DEFAULT_CONFIG,
} from "./types";

/**
 * Main core class that handles suggestion generation and application
 */
export class NESCore {
  private api: OllamaAPI;
  private contextManager: ContextManager;
  private config: Required<NESConfig>;

  constructor(config: Partial<NESConfig> = {}) {
    // Merge with default configuration
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      ollama: {
        ...DEFAULT_CONFIG.ollama,
        ...config.ollama,
      },
    };

    this.api = new OllamaAPI(this.config.ollama);
    this.contextManager = new ContextManager(
      this.config.contextWindow,
      this.config.systemPrompt || undefined
    );
  }

  /**
   * Generate edit suggestions for a file at a specific cursor position
   */
  async getSuggestion(
    filePath: string,
    cursor?: [number, number],
    originalContent?: string
  ): Promise<SuggestionResult> {
    try {
      // Validate inputs
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Create editing context
      const context = await this.contextManager.createContext(
        filePath,
        cursor,
        originalContent
      );

      // Create payload for API
      const payload = this.contextManager.createPayload(
        context,
        this.config.ollama.model
      );

      this.debugLog("Generated context for suggestion", {
        filename: context.filename,
        filetype: context.filetype,
        cursorPosition: context.currentVersion.cursor,
      });

      // Call API to get suggestion
      return new Promise((resolve, reject) => {
        this.api.call(
          payload,
          (output: string) => {
            try {
              const suggestions = this.parseSuggestion(context, output);
              const result: SuggestionResult = {
                suggestions,
                context,
                timestamp: Date.now(),
              };

              this.debugLog("Generated suggestions", {
                count: suggestions.length,
                suggestionIds: suggestions.map((s) => s.id),
              });

              resolve(result);
            } catch (error) {
              this.debugLog("Failed to parse suggestion", { error, output });
              reject(
                new Error(
                  `Failed to parse suggestion: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`
                )
              );
            }
          },
          { stream: true }
        );
      });
    } catch (error) {
      this.debugLog("Error generating suggestion", { error, filePath, cursor });
      throw new Error(
        `Failed to generate suggestion: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Parse AI response into structured edit suggestions
   */
  private parseSuggestion(
    context: EditContext,
    aiResponse: string
  ): EditSuggestion[] {
    // Clean and validate response
    let cleanedResponse = aiResponse.trim();

    if (!cleanedResponse.includes("<next-version>")) {
      throw new Error("Invalid response: missing <next-version> tag");
    }

    // Extract the next version content
    const nextVersionMatch = cleanedResponse.match(
      /<next-version>(.*?)<\/next-version>/s
    );
    if (!nextVersionMatch) {
      throw new Error("Invalid response: malformed <next-version> tag");
    }

    let nextVersionContent = nextVersionMatch[1].trim();

    // Remove code block markers if present
    nextVersionContent = this.removeCodeBlockMarkers(nextVersionContent);

    // Remove cursor marker for diff comparison (AI often doesn't preserve it)
    const oldVersion = context.currentVersion.text.replace("<|cursor|>", "");
    nextVersionContent = nextVersionContent.replace("<|cursor|>", "");

    // Generate diff between old and new versions
    const diffResult = createDiff(oldVersion, nextVersionContent, {
      ignoreWhitespace: false,
      newlineIsToken: true,
    });

    // Convert diff to TextEdit suggestions
    const suggestions: EditSuggestion[] = [];
    let lineOffset = context.currentVersion.startRow;
    let currentLine = 0;

    for (const chunk of diffResult) {
      if (chunk.added || chunk.removed) {
        const textEdit = this.createTextEditFromDiff(
          chunk,
          currentLine + lineOffset,
          diffResult
        );

        if (textEdit) {
          suggestions.push({
            textEdit,
            id: `edit-${suggestions.length}-${Date.now()}`,
            confidence: this.calculateConfidence(chunk),
          });
        }
      }

      if (!chunk.added) {
        currentLine += (chunk.value.match(/\n/g) || []).length;
      }
    }

    // Limit suggestions based on configuration
    return suggestions.slice(0, this.config.maxSuggestions);
  }

  /**
   * Remove markdown code block markers from content
   */
  private removeCodeBlockMarkers(content: string): string {
    const lines = content.split("\n");

    // Remove opening ```language marker
    if (lines[0] && lines[0].startsWith("```")) {
      lines.shift();
    }

    // Remove closing ``` marker
    if (lines[lines.length - 1] && lines[lines.length - 1].trim() === "```") {
      lines.pop();
    }

    return lines.join("\n");
  }

  /**
   * Create TextEdit from diff chunk
   */
  private createTextEditFromDiff(
    chunk: any,
    startLine: number,
    allChunks: any[]
  ): TextEdit | null {
    const lines = chunk.value.split("\n").filter((line: string) => line !== "");

    if (lines.length === 0) return null;

    const range: Range = {
      start: { line: startLine, character: 0 },
      end: {
        line: startLine + (chunk.removed ? lines.length : 0),
        character: 0,
      },
    };

    const newText = chunk.added ? chunk.value : "";

    return {
      range,
      newText,
    };
  }

  /**
   * Calculate confidence score for a suggestion
   */
  private calculateConfidence(chunk: any): number {
    // Simple heuristic based on change size and type
    const lines = chunk.value
      .split("\n")
      .filter((line: string) => line.trim() !== "");
    const lineCount = lines.length;

    // Smaller changes generally have higher confidence
    if (lineCount <= 2) return 0.9;
    if (lineCount <= 5) return 0.8;
    if (lineCount <= 10) return 0.7;
    return 0.6;
  }

  /**
   * Apply a single suggestion to a file
   */
  async applySuggestion(
    suggestion: EditSuggestion,
    filePath: string,
    options: ApplyOptions = {}
  ): Promise<ApplyResult> {
    try {
      // Read current file content
      const currentContent = await fs.promises.readFile(filePath, "utf-8");
      const lines = currentContent.split("\n");

      // Create backup if requested
      let backupPath: string | undefined;
      if (options.backup) {
        backupPath = `${filePath}.backup.${Date.now()}`;
        await fs.promises.writeFile(backupPath, currentContent);
      }

      // Apply the text edit
      const result = this.applyTextEdit(lines, suggestion.textEdit);

      // Write the modified content back to file
      const newContent = result.lines.join("\n");
      await fs.promises.writeFile(filePath, newContent);

      this.debugLog("Applied suggestion", {
        suggestionId: suggestion.id,
        filePath,
        linesAffected: result.linesAffected,
        newCursor: result.newCursor,
      });

      return {
        success: true,
        linesAffected: result.linesAffected,
        newCursor: result.newCursor,
        backupPath,
      };
    } catch (error) {
      this.debugLog("Failed to apply suggestion", {
        error,
        suggestionId: suggestion.id,
        filePath,
      });

      return {
        success: false,
        linesAffected: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Apply a TextEdit to an array of lines
   */
  private applyTextEdit(
    lines: string[],
    textEdit: TextEdit
  ): { lines: string[]; linesAffected: number; newCursor?: [number, number] } {
    const { range, newText } = textEdit;
    const startLine = range.start.line;
    const endLine = range.end.line;

    // Validate range
    if (startLine < 0 || startLine >= lines.length) {
      throw new Error(`Invalid start line: ${startLine}`);
    }

    if (endLine < startLine || endLine > lines.length) {
      throw new Error(`Invalid end line: ${endLine}`);
    }

    // Calculate lines affected
    const deletedLines = endLine - startLine;
    const newLines = newText.split("\n");
    const addedLines = newText === "" ? 0 : newLines.length;

    // Apply the edit
    const beforeLines = lines.slice(0, startLine);
    const afterLines = lines.slice(endLine);

    let resultLines: string[];
    if (newText === "") {
      // Deletion only
      resultLines = [...beforeLines, ...afterLines];
    } else {
      // Addition or replacement
      resultLines = [...beforeLines, ...newLines, ...afterLines];
    }

    // Calculate new cursor position (end of applied edit)
    const newCursor: [number, number] = [
      startLine + addedLines - 1,
      addedLines > 0 ? newLines[newLines.length - 1].length : 0,
    ];

    return {
      lines: resultLines,
      linesAffected: Math.max(deletedLines, addedLines),
      newCursor,
    };
  }

  /**
   * Apply multiple suggestions in sequence
   */
  async applySuggestions(
    suggestions: EditSuggestion[],
    filePath: string,
    options: ApplyOptions = {}
  ): Promise<ApplyResult[]> {
    const results: ApplyResult[] = [];

    for (const suggestion of suggestions) {
      const result = await this.applySuggestion(suggestion, filePath, {
        ...options,
        backup: options.backup && results.length === 0, // Only backup on first application
      });

      results.push(result);

      if (!result.success && !options.trigger) {
        // Stop on first failure unless trigger is enabled
        break;
      }
    }

    return results;
  }

  /**
   * Clear any cached suggestions or state
   */
  clearSuggestions(): void {
    this.debugLog("Cleared suggestions");
    // In this implementation, we don't maintain state between calls
    // This method exists for API compatibility
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<NESConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<NESConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      ollama: {
        ...this.config.ollama,
        ...newConfig.ollama,
      },
    };

    // Update dependent components
    this.api.updateConfig(this.config.ollama);

    if (newConfig.contextWindow) {
      this.contextManager.setContextWindow(newConfig.contextWindow);
    }

    if (newConfig.systemPrompt) {
      this.contextManager.setSystemPrompt(newConfig.systemPrompt);
    }

    this.debugLog("Configuration updated", newConfig);
  }

  /**
   * Debug logging utility
   */
  private debugLog(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[NES Debug] ${message}`, data || "");
    }
  }

  /**
   * Health check for the entire system
   */
  async healthCheck(): Promise<{
    api: boolean;
    model: boolean;
    config: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let apiHealthy = false;
    let modelHealthy = false;
    let configHealthy = true;

    try {
      apiHealthy = await this.api.healthCheck();
      if (!apiHealthy) {
        errors.push("Ollama API is not accessible");
      }
    } catch (error) {
      errors.push(
        `API health check failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    try {
      const models = await this.api.getAvailableModels();
      modelHealthy = models.includes(this.config.ollama.model!);
      if (!modelHealthy) {
        errors.push(`Model '${this.config.ollama.model}' is not available`);
      }
    } catch (error) {
      errors.push(
        `Model check failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    // Validate configuration
    if (!this.config.ollama.baseUrl) {
      configHealthy = false;
      errors.push("Missing Ollama base URL");
    }

    if (!this.config.ollama.model) {
      configHealthy = false;
      errors.push("Missing model name");
    }

    return {
      api: apiHealthy,
      model: modelHealthy,
      config: configHealthy,
      errors,
    };
  }

  /**
   * Debug method to print system information
   */
  async debug(): Promise<void> {
    console.log("🔍 NES System Debug Information:");
    console.log("================================");

    // Configuration
    console.log("Configuration:", {
      model: this.config.ollama.model,
      baseUrl: this.config.ollama.baseUrl,
      contextWindow: this.config.contextWindow,
      maxSuggestions: this.config.maxSuggestions,
      debug: this.config.debug,
    });

    // Health check
    const health = await this.healthCheck();
    console.log("Health Check:", health);

    // API debug
    await this.api.debug();
  }
}

/**
 * Main entry point for the NES (Next Edit Suggestion) TypeScript implementation
 *
 * This module provides a clean, simple API for generating and applying
 * AI-powered code edit suggestions using local Ollama models.
 */

import { NESCore } from "./core";
import { OllamaAPI } from "./api";
import { ContextManager } from "./context";
import {
  NESConfig,
  SuggestionResult,
  ApplyResult,
  ApplyOptions,
  EditSuggestion,
  EditContext,
  DEFAULT_CONFIG,
} from "./types";

/**
 * Main NES class that provides the public API
 */
export class NES {
  private core: NESCore;

  constructor(config: Partial<NESConfig> = {}) {
    this.core = new NESCore(config);
  }

  /**
   * Generate edit suggestions for a file
   *
   * @param filePath - Path to the file to analyze
   * @param cursor - Optional cursor position [line, column] (0-based)
   * @param originalContent - Optional original content for comparison
   * @returns Promise resolving to suggestion result
   */
  async getSuggestion(
    filePath: string,
    cursor?: [number, number],
    originalContent?: string
  ): Promise<SuggestionResult> {
    return this.core.getSuggestion(filePath, cursor, originalContent);
  }

  /**
   * Apply a single suggestion to a file
   *
   * @param suggestion - The suggestion to apply
   * @param filePath - Path to the file to modify
   * @param options - Optional apply options
   * @returns Promise resolving to apply result
   */
  async applySuggestion(
    suggestion: EditSuggestion,
    filePath: string,
    options?: ApplyOptions
  ): Promise<ApplyResult> {
    return this.core.applySuggestion(suggestion, filePath, options);
  }

  /**
   * Apply multiple suggestions in sequence
   *
   * @param suggestions - Array of suggestions to apply
   * @param filePath - Path to the file to modify
   * @param options - Optional apply options
   * @returns Promise resolving to array of apply results
   */
  async applySuggestions(
    suggestions: EditSuggestion[],
    filePath: string,
    options?: ApplyOptions
  ): Promise<ApplyResult[]> {
    return this.core.applySuggestions(suggestions, filePath, options);
  }

  /**
   * Clear any cached suggestions or state
   */
  clearSuggestions(): void {
    this.core.clearSuggestions();
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<NESConfig> {
    return this.core.getConfig();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<NESConfig>): void {
    this.core.updateConfig(newConfig);
  }

  /**
   * Perform a health check on the system
   */
  async healthCheck(): Promise<{
    api: boolean;
    model: boolean;
    config: boolean;
    errors: string[];
  }> {
    return this.core.healthCheck();
  }

  /**
   * Debug method to print system information
   */
  async debug(): Promise<void> {
    return this.core.debug();
  }

  /**
   * Setup the system with initial configuration and model pulling
   */
  static async setup(config: Partial<NESConfig> = {}): Promise<NES> {
    const nes = new NES(config);

    // Verify Ollama is available
    const health = await nes.healthCheck();

    if (!health.api) {
      throw new Error(
        "Ollama is not accessible. Please ensure Ollama is running:\n" +
          "  ollama serve"
      );
    }

    if (!health.model) {
      console.log(
        `📥 Model '${
          nes.getConfig().ollama.model
        }' not found. Attempting to pull...`
      );

      try {
        const api = new OllamaAPI(nes.getConfig().ollama);
        await api.pullModel();
        console.log("✅ Model pulled successfully");
      } catch (error) {
        throw new Error(
          `Failed to pull model '${nes.getConfig().ollama.model}':\n` +
            `${error instanceof Error ? error.message : "Unknown error"}\n\n` +
            "Please pull the model manually:\n" +
            `  ollama pull ${nes.getConfig().ollama.model}`
        );
      }
    }

    return nes;
  }
}

// Re-export types and utilities for external use
export {
  // Core classes
  NESCore,
  OllamaAPI,
  ContextManager,

  // Types
  NESConfig,
  SuggestionResult,
  ApplyResult,
  ApplyOptions,
  EditSuggestion,
  EditContext,

  // Constants
  DEFAULT_CONFIG,
};

// Default export
export default NES;

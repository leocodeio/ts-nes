"use strict";
/**
 * Main entry point for the NES (Next Edit Suggestion) TypeScript implementation
 *
 * This module provides a clean, simple API for generating and applying
 * AI-powered code edit suggestions using local Ollama models.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = exports.ContextManager = exports.OllamaAPI = exports.NESCore = exports.NES = void 0;
const core_1 = require("./core");
Object.defineProperty(exports, "NESCore", { enumerable: true, get: function () { return core_1.NESCore; } });
const api_1 = require("./api");
Object.defineProperty(exports, "OllamaAPI", { enumerable: true, get: function () { return api_1.OllamaAPI; } });
const context_1 = require("./context");
Object.defineProperty(exports, "ContextManager", { enumerable: true, get: function () { return context_1.ContextManager; } });
const types_1 = require("./types");
Object.defineProperty(exports, "DEFAULT_CONFIG", { enumerable: true, get: function () { return types_1.DEFAULT_CONFIG; } });
/**
 * Main NES class that provides the public API
 */
class NES {
    constructor(config = {}) {
        this.core = new core_1.NESCore(config);
    }
    /**
     * Generate edit suggestions for a file
     *
     * @param filePath - Path to the file to analyze
     * @param cursor - Optional cursor position [line, column] (0-based)
     * @param originalContent - Optional original content for comparison
     * @returns Promise resolving to suggestion result
     */
    async getSuggestion(filePath, cursor, originalContent) {
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
    async applySuggestion(suggestion, filePath, options) {
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
    async applySuggestions(suggestions, filePath, options) {
        return this.core.applySuggestions(suggestions, filePath, options);
    }
    /**
     * Clear any cached suggestions or state
     */
    clearSuggestions() {
        this.core.clearSuggestions();
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return this.core.getConfig();
    }
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.core.updateConfig(newConfig);
    }
    /**
     * Perform a health check on the system
     */
    async healthCheck() {
        return this.core.healthCheck();
    }
    /**
     * Debug method to print system information
     */
    async debug() {
        return this.core.debug();
    }
    /**
     * Setup the system with initial configuration and model pulling
     */
    static async setup(config = {}) {
        const nes = new NES(config);
        // Verify Ollama is available
        const health = await nes.healthCheck();
        if (!health.api) {
            throw new Error("Ollama is not accessible. Please ensure Ollama is running:\n" +
                "  ollama serve");
        }
        if (!health.model) {
            console.log(`📥 Model '${nes.getConfig().ollama.model}' not found. Attempting to pull...`);
            try {
                const api = new api_1.OllamaAPI(nes.getConfig().ollama);
                await api.pullModel();
                console.log("✅ Model pulled successfully");
            }
            catch (error) {
                throw new Error(`Failed to pull model '${nes.getConfig().ollama.model}':\n` +
                    `${error instanceof Error ? error.message : "Unknown error"}\n\n` +
                    "Please pull the model manually:\n" +
                    `  ollama pull ${nes.getConfig().ollama.model}`);
            }
        }
        return nes;
    }
}
exports.NES = NES;
// Default export
exports.default = NES;
//# sourceMappingURL=nes.js.map
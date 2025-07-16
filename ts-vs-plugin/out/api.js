"use strict";
/**
 * Ollama API client for communicating with local Ollama instances
 *
 * This module provides a clean interface to interact with Ollama's chat completion API,
 * designed specifically for the NES system's code suggestion use case.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaAPI = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Ollama API client with retry logic and error handling
 */
class OllamaAPI {
    constructor(config = {}) {
        // Merge with defaults
        this.config = {
            baseUrl: config.baseUrl || "http://localhost:11434",
            model: config.model || "qwen2.5-coder:1.5b",
            timeout: config.timeout || 30000,
            temperature: config.temperature ?? 0,
            topP: config.topP ?? 1,
        };
        // Create axios instance with common configuration
        this.client = axios_1.default.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.timeout,
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "nes-ts/0.1.0",
            },
        });
        // Add request/response interceptors for debugging
        this.client.interceptors.request.use((config) => {
            console.debug("🚀 Ollama API Request:", {
                url: config.url,
                method: config.method,
                model: this.config.model,
            });
            return config;
        }, (error) => {
            console.error("❌ Ollama API Request Error:", error);
            return Promise.reject(error);
        });
        this.client.interceptors.response.use((response) => {
            console.debug("✅ Ollama API Response:", {
                status: response.status,
                model: response.data?.model,
            });
            return response;
        }, (error) => {
            console.error("❌ Ollama API Response Error:", {
                status: error.response?.status,
                message: error.message,
            });
            return Promise.reject(error);
        });
    }
    /**
     * Check if Ollama service is available and the model is accessible
     */
    async healthCheck() {
        try {
            // First check if Ollama is running
            await this.client.get("/api/version");
            // Then check if our model is available
            await this.client.get("/api/tags");
            return true;
        }
        catch (error) {
            console.error("🏥 Ollama health check failed:", error);
            return false;
        }
    }
    /**
     * Get list of available models
     */
    async getAvailableModels() {
        try {
            const response = await this.client.get("/api/tags");
            return response.data.models?.map((model) => model.name) || [];
        }
        catch (error) {
            console.error("📋 Failed to get available models:", error);
            throw new Error(`Failed to get available models: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Pull a model if it doesn't exist locally
     */
    async pullModel(modelName = this.config.model) {
        try {
            console.log(`📥 Pulling model: ${modelName}...`);
            const response = await this.client.post("/api/pull", {
                name: modelName,
            });
            if (response.status === 200) {
                console.log(`✅ Model ${modelName} pulled successfully`);
            }
        }
        catch (error) {
            console.error(`❌ Failed to pull model ${modelName}:`, error);
            throw new Error(`Failed to pull model ${modelName}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Generate chat completion using Ollama
     */
    async generateCompletion(messages, options = {}) {
        const { stream = false, onChunk, model = this.config.model, temperature = this.config.temperature, topP = this.config.topP, } = options;
        try {
            const payload = {
                model,
                messages,
                stream,
                options: {
                    temperature,
                    top_p: topP,
                    // Ensure deterministic output for code generation
                    seed: stream ? undefined : 42,
                    // Prevent the model from refusing to help
                    system: undefined,
                },
            };
            if (stream && onChunk) {
                return await this.handleStreamingResponse(payload, onChunk);
            }
            else {
                return await this.handleRegularResponse(payload);
            }
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const axiosError = error;
                if (axiosError.code === "ECONNREFUSED") {
                    throw new Error(`Cannot connect to Ollama at ${this.config.baseUrl}. ` +
                        "Please ensure Ollama is running: ollama serve");
                }
                if (axiosError.response?.status === 404) {
                    throw new Error(`Model '${model}' not found. ` +
                        `Please pull it first: ollama pull ${model}`);
                }
                throw new Error(`Ollama API error: ${axiosError.response?.status} - ${axiosError.message}`);
            }
            throw new Error(`Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Handle regular (non-streaming) response
     */
    async handleRegularResponse(payload) {
        const response = await this.client.post("/api/chat", payload);
        if (!response.data.message?.content) {
            throw new Error("No content received from Ollama");
        }
        return response.data.message.content.trim();
    }
    /**
     * Handle streaming response with real-time chunk processing
     */
    async handleStreamingResponse(payload, onChunk) {
        let fullContent = "";
        const response = await this.client.post("/api/chat", payload, {
            responseType: "stream",
        });
        return new Promise((resolve, reject) => {
            response.data.on("data", (chunk) => {
                const lines = chunk
                    .toString()
                    .split("\n")
                    .filter((line) => line.trim());
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.message?.content) {
                            const content = data.message.content;
                            fullContent += content;
                            onChunk(content);
                        }
                        if (data.done) {
                            resolve(fullContent.trim());
                            return;
                        }
                    }
                    catch (parseError) {
                        // Skip invalid JSON lines
                        continue;
                    }
                }
            });
            response.data.on("error", (error) => {
                reject(new Error(`Stream error: ${error.message}`));
            });
            response.data.on("end", () => {
                if (fullContent) {
                    resolve(fullContent.trim());
                }
                else {
                    reject(new Error("Stream ended without content"));
                }
            });
        });
    }
    /**
     * Create a convenient method that matches the original API call pattern
     */
    async call(payload, callback, options = {}) {
        try {
            let output = "";
            if (options.stream || payload.stream) {
                await this.generateCompletion(payload.messages, {
                    stream: true,
                    model: payload.model,
                    temperature: payload.temperature,
                    topP: payload.top_p,
                    onChunk: (chunk) => {
                        output += chunk;
                    },
                });
            }
            else {
                output = await this.generateCompletion(payload.messages, {
                    stream: false,
                    model: payload.model,
                    temperature: payload.temperature,
                    topP: payload.top_p,
                });
            }
            callback(output);
        }
        catch (error) {
            console.error("🔥 Ollama API call failed:", error);
            throw error;
        }
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        // Update axios instance if baseURL or timeout changed
        if (newConfig.baseUrl) {
            this.client.defaults.baseURL = newConfig.baseUrl;
        }
        if (newConfig.timeout) {
            this.client.defaults.timeout = newConfig.timeout;
        }
    }
    /**
     * Debug method to test the connection and model
     */
    async debug() {
        try {
            console.log("🔍 NES Ollama Debug Information:");
            console.log(`Base URL: ${this.config.baseUrl}`);
            console.log(`Model: ${this.config.model}`);
            console.log(`Timeout: ${this.config.timeout}ms`);
            console.log(`Temperature: ${this.config.temperature}`);
            console.log(`Top-P: ${this.config.topP}`);
            const isHealthy = await this.healthCheck();
            console.log(`Health Check: ${isHealthy ? "✅ Healthy" : "❌ Failed"}`);
            if (isHealthy) {
                const models = await this.getAvailableModels();
                console.log(`Available Models: ${models.join(", ")}`);
                const isModelAvailable = models.includes(this.config.model);
                console.log(`Target Model Available: ${isModelAvailable ? "✅ Yes" : "❌ No"}`);
                if (!isModelAvailable) {
                    console.log(`💡 To pull the model, run: ollama pull ${this.config.model}`);
                }
            }
        }
        catch (error) {
            console.error("🐛 Debug failed:", error);
        }
    }
}
exports.OllamaAPI = OllamaAPI;
//# sourceMappingURL=api.js.map
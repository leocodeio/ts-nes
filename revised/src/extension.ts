/**
 * VS Code Extension for NES (Next Edit Suggestion)
 *
 * This extension integrates the NES TypeScript module with VS Code to provide
 * AI-powered code suggestions using local Ollama models.
 */

import * as vscode from "vscode";
import { NES } from "./nes";
import { EditSuggestion, SuggestionResult, NESConfig } from "./types";
import * as path from "path";
import * as fs from "fs";

/**
 * Manages the NES extension state and operations
 */
class NESExtension {
  private nes: NES | null = null;
  private outputChannel: vscode.OutputChannel;
  private statusBarItem: vscode.StatusBarItem;
  private lastSuggestions: EditSuggestion[] = [];
  private suggestionProvider: SuggestionProvider;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel("NES");
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.suggestionProvider = new SuggestionProvider();
    this.updateStatusBar("Initializing...");
  }

  /**
   * Get the suggestion provider (public accessor)
   */
  getSuggestionProvider(): SuggestionProvider {
    return this.suggestionProvider;
  }

  /**
   * Initialize the NES system with current configuration
   */
  async initialize(): Promise<void> {
    try {
      const config = this.getConfiguration();
      this.log("Initializing NES with configuration:", config);

      this.nes = await NES.setup(config);
      this.updateStatusBar("Ready", true);
      this.log("NES initialized successfully");

      // Perform health check
      const health = await this.nes.healthCheck();
      if (!health.api || !health.model) {
        const errors = health.errors.join(", ");
        this.showError(`NES health check failed: ${errors}`);
        this.updateStatusBar("Health Check Failed", false);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      this.showError(`Failed to initialize NES: ${errorMsg}`);
      this.updateStatusBar("Failed", false);
      this.log("Initialization failed:", errorMsg);
    }
  }

  /**
   * Get current VS Code configuration for NES
   */
  private getConfiguration(): Partial<NESConfig> {
    const config = vscode.workspace.getConfiguration("nes");

    return {
      ollama: {
        baseUrl: config.get("ollama.baseUrl", "http://localhost:11434"),
        model: config.get("ollama.model", "qwen2.5-coder:1.5b"),
        timeout: config.get("ollama.timeout", 30000),
        temperature: config.get("ollama.temperature", 0),
        topP: config.get("ollama.topP", 1),
      },
      contextWindow: config.get("contextWindow", 20),
      maxSuggestions: config.get("maxSuggestions", 5),
      debug: config.get("debug", false),
    };
  }

  /**
   * Generate suggestions for the current cursor position
   */
  async getSuggestion(): Promise<void> {
    if (!this.nes) {
      this.showError("NES not initialized. Please check your Ollama setup.");
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      this.showError("No active editor found");
      return;
    }

    try {
      this.updateStatusBar("Generating suggestions...", true);
      this.log("Generating suggestions for:", editor.document.fileName);

      // Get cursor position
      const position = editor.selection.active;
      const cursor: [number, number] = [position.line, position.character];

      // Save current document to a temporary file for processing
      const tempFilePath = await this.saveDocumentToTemp(editor.document);

      // Generate suggestions
      const result = await this.nes.getSuggestion(tempFilePath, cursor);

      // Clean up temp file
      this.cleanupTempFile(tempFilePath);

      this.lastSuggestions = result.suggestions;
      this.log(`Generated ${result.suggestions.length} suggestions`);

      if (result.suggestions.length === 0) {
        this.showInfo("No suggestions generated for current position");
        this.updateStatusBar("No suggestions", true);
        return;
      }

      // Show suggestions to user
      await this.showSuggestions(result);
      this.updateStatusBar(`${result.suggestions.length} suggestions`, true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      this.showError(`Failed to generate suggestions: ${errorMsg}`);
      this.updateStatusBar("Error", false);
      this.log("Error generating suggestions:", errorMsg);
    }
  }

  /**
   * Show suggestions to the user and handle selection
   */
  private async showSuggestions(result: SuggestionResult): Promise<void> {
    const items = result.suggestions.map((suggestion, index) => ({
      label: `Suggestion ${index + 1}`,
      description: this.getSuggestionPreview(suggestion),
      suggestion,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: "Select a suggestion to apply",
      ignoreFocusOut: true,
    });

    if (selected) {
      await this.applySuggestion(selected.suggestion);
    }
  }

  /**
   * Get a preview of the suggestion for display
   */
  private getSuggestionPreview(suggestion: EditSuggestion): string {
    const text = suggestion.textEdit.newText;
    const preview = text.length > 50 ? text.substring(0, 50) + "..." : text;
    return preview.replace(/\n/g, "↵");
  }

  /**
   * Apply a suggestion to the current editor
   */
  async applySuggestion(suggestion?: EditSuggestion): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      this.showError("No active editor found");
      return;
    }

    const suggestionToApply = suggestion || this.lastSuggestions[0];
    if (!suggestionToApply) {
      this.showError("No suggestion to apply");
      return;
    }

    try {
      this.log("Applying suggestion:", suggestionToApply);

      // Convert NES TextEdit to VS Code WorkspaceEdit
      const edit = new vscode.WorkspaceEdit();
      const range = new vscode.Range(
        suggestionToApply.textEdit.range.start.line,
        suggestionToApply.textEdit.range.start.character,
        suggestionToApply.textEdit.range.end.line,
        suggestionToApply.textEdit.range.end.character
      );

      edit.replace(
        editor.document.uri,
        range,
        suggestionToApply.textEdit.newText
      );

      const success = await vscode.workspace.applyEdit(edit);

      if (success) {
        this.showInfo("Suggestion applied successfully");
        this.log("Suggestion applied successfully");

        // Check if auto-apply is enabled for next suggestion
        const config = vscode.workspace.getConfiguration("nes");
        if (config.get("autoApply", false)) {
          // Wait a bit then generate next suggestion
          setTimeout(() => this.getSuggestion(), 1000);
        }
      } else {
        this.showError("Failed to apply suggestion");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      this.showError(`Failed to apply suggestion: ${errorMsg}`);
      this.log("Error applying suggestion:", errorMsg);
    }
  }

  /**
   * Perform health check and show results
   */
  async performHealthCheck(): Promise<void> {
    if (!this.nes) {
      await this.initialize();
      return;
    }

    try {
      this.log("Performing health check...");
      const health = await this.nes.healthCheck();

      let message = "Health Check Results:\n";
      message += `API: ${health.api ? "✅" : "❌"}\n`;
      message += `Model: ${health.model ? "✅" : "❌"}\n`;
      message += `Config: ${health.config ? "✅" : "❌"}`;

      if (health.errors.length > 0) {
        message += `\nErrors: ${health.errors.join(", ")}`;
      }

      this.log(message);
      this.showInfo(message);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      this.showError(`Health check failed: ${errorMsg}`);
    }
  }

  /**
   * Show extension settings
   */
  showSettings(): void {
    vscode.commands.executeCommand("workbench.action.openSettings", "nes");
  }

  /**
   * Save document content to a temporary file
   */
  private async saveDocumentToTemp(
    document: vscode.TextDocument
  ): Promise<string> {
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const fileName = path.basename(document.fileName);
    const tempPath = path.join(tempDir, `${Date.now()}_${fileName}`);

    fs.writeFileSync(tempPath, document.getText());
    return tempPath;
  }

  /**
   * Clean up temporary file
   */
  private cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      this.log("Failed to cleanup temp file:", error);
    }
  }

  /**
   * Update status bar item
   */
  private updateStatusBar(text: string, isReady: boolean = true): void {
    this.statusBarItem.text = `$(lightbulb) NES: ${text}`;
    this.statusBarItem.color = isReady
      ? undefined
      : new vscode.ThemeColor("errorForeground");
    this.statusBarItem.command = "nes.getSuggestion";
    this.statusBarItem.show();
  }

  /**
   * Log message to output channel
   */
  private log(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    this.outputChannel.appendLine(`[${timestamp}] ${message}`);
    if (data) {
      this.outputChannel.appendLine(JSON.stringify(data, null, 2));
    }
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    vscode.window.showErrorMessage(`NES: ${message}`);
    this.log(`ERROR: ${message}`);
  }

  /**
   * Show info message
   */
  private showInfo(message: string): void {
    vscode.window.showInformationMessage(`NES: ${message}`);
    this.log(`INFO: ${message}`);
  }

  /**
   * Dispose extension resources
   */
  dispose(): void {
    this.outputChannel.dispose();
    this.statusBarItem.dispose();
  }
}

/**
 * Code completion provider for inline suggestions
 */
class SuggestionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    // For now, return empty - we'll use manual suggestions
    // This could be enhanced to provide automatic suggestions
    return [];
  }
}

// Global extension instance
let nesExtension: NESExtension;

/**
 * Extension activation function
 */
export function activate(context: vscode.ExtensionContext) {
  console.log("NES extension is being activated");

  // Create extension instance
  nesExtension = new NESExtension();

  // Register commands
  const commands = [
    vscode.commands.registerCommand("nes.getSuggestion", () =>
      nesExtension.getSuggestion()
    ),
    vscode.commands.registerCommand("nes.applySuggestion", () =>
      nesExtension.applySuggestion()
    ),
    vscode.commands.registerCommand("nes.showSettings", () =>
      nesExtension.showSettings()
    ),
    vscode.commands.registerCommand("nes.healthCheck", () =>
      nesExtension.performHealthCheck()
    ),
  ];

  // Register completion provider
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    [
      { scheme: "file", language: "typescript" },
      { scheme: "file", language: "javascript" },
      { scheme: "file", language: "python" },
      { scheme: "file", language: "java" },
      { scheme: "file", language: "cpp" },
      { scheme: "file", language: "go" },
      { scheme: "file", language: "rust" },
    ],
    nesExtension.getSuggestionProvider()
  );

  // Add disposables to context
  context.subscriptions.push(...commands, completionProvider, nesExtension);

  // Initialize NES system
  nesExtension.initialize();

  console.log("NES extension activated successfully");
}

/**
 * Extension deactivation function
 */
export function deactivate() {
  console.log("NES extension is being deactivated");
  if (nesExtension) {
    nesExtension.dispose();
  }
}

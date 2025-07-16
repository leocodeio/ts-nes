    };
    
    this.operationHistory.push(operation);
    this.emit('operation', operation);
  }

  /**
   * Get operation history
   */
  getHistory(): CalculatorOperation[] {
    return [...this.operationHistory];
  }

  /**
   * Clear calculator and history
   */
  clear(): this {
    this.currentValue = 0;
    this.operationHistory = [];
    this.emit('cleared');
    return this;
  }

  /**
   * Simple event emitter functionality
   */
  private emit(event: string, data?: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  /**
   * Add event listener
   */
  on(event: string, callback: Function): this {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }
}

// Export for testing
export default EnhancedCalculator;

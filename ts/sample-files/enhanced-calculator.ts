/**
 * Enhanced Calculator Class - Test file for NES processing
 * This file demonstrates how NES can suggest improvements and completions
 */

export interface CalculatorOperation {
  type: 'add' | 'subtract' | 'multiply' | 'divide';
  value: number;
  result: number;
  timestamp: Date;
}

/**
 * Advanced calculator with operation history and callback support
 */
export class EnhancedCalculator {
  private currentValue: number = 0;
  private operationHistory: CalculatorOperation[] = [];
  private precision: number = 2;
  private listeners: { [event: string]: Function[] } = {};

  constructor(initialValue: number = 0, precision: number = 2) {
    this.currentValue = initialValue;
    this.precision = precision;
    this.emit('initialized', { value: initialValue, precision });
  }

  /**
   * Add a number to the current value
   */
  add(value: number): this {
    this.currentValue += value;
    this.recordOperation('add', value);
    return this;
  }

  /**
   * Subtract a number from the current value
   */
  subtract(value: number): this {
    this.currentValue -= value;
    this.recordOperation('subtract', value);
    return this;
  }
      timestamp: new Date()
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

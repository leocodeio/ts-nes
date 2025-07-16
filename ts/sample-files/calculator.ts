/**
 * Sample TypeScript file for testing NES suggestions
 * This file demonstrates various scenarios where AI can provide helpful suggestions
 */

// Import statements
import { EventEmitter } from "events";

/**
 * A simple calculator class with basic arithmetic operations
 */
export class Calculator extends EventEmitter {
  private history: number[] = [];
  private currentValue: number = 0;

  constructor(initialValue: number = 0) {
    super();
    this.currentValue = initialValue;
    this.emit("initialized", initialValue);
  }

  /**
   * Add a number to the current value
   * @param value - The number to add
   * @returns The calculator instance for chaining
   */
  add(value: number): Calculator {
    this.currentValue += value;
    this.history.push(this.currentValue);
    this.emit("operation", "add", value, this.currentValue);
    return this;
  }

  /**
   * Subtract a number from the current value
   * @param value - The number to subtract
   * @returns The calculator instance for chaining
   */
  subtract(value: number): Calculator {
    this.currentValue -= value;
    this.history.push(this.currentValue);
    this.emit("operation", "subtract", value, this.currentValue);
    return this;
  }

  // TODO: Add multiply method
  // <|cursor|>

  /**
   * Get the current value
   * @returns The current calculated value
   */
  getValue(): number {
    return this.currentValue;
  }

  /**
   * Get the calculation history
   * @returns Array of historical values
   */
  getHistory(): number[] {
    return [...this.history];
  }

  /**
   * Reset the calculator to zero
   */
  reset(): void {
    this.currentValue = 0;
    this.history = [];
    this.emit("reset");
  }

  // TODO: Add divide method with error handling for division by zero

  // TODO: Add percentage calculation method

  /**
   * Calculate the average of all values in history
   * @returns The average value or 0 if no history
   */
  getAverage(): number {
    if (this.history.length === 0) return 0;
    const sum = this.history.reduce((acc, val) => acc + val, 0);
    return sum / this.history.length;
  }
}

// TODO: Add a ScientificCalculator class that extends Calculator

/**
 * Utility functions for mathematical operations
 */
export class MathUtils {
  /**
   * Check if a number is prime
   * @param num - The number to check
   * @returns True if the number is prime
   */
  static isPrime(num: number): boolean {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  }

  // TODO: Add factorial method

  // TODO: Add fibonacci sequence generator

  /**
   * Calculate the greatest common divisor of two numbers
   * @param a - First number
   * @param b - Second number
   * @returns The GCD of a and b
   */
  static gcd(a: number, b: number): number {
    while (b !== 0) {
      [a, b] = [b, a % b];
    }
    return Math.abs(a);
  }
}

// Example usage and tests
if (require.main === module) {
  const calc = new Calculator(10);

  calc.on("operation", (op, value, result) => {
    console.log(`Operation: ${op}(${value}) = ${result}`);
  });

  calc.add(5).subtract(3).add(2);
  console.log("Final value:", calc.getValue());
  console.log("History:", calc.getHistory());
  console.log("Average:", calc.getAverage());

  // Test MathUtils
  console.log("Is 17 prime?", MathUtils.isPrime(17));
  console.log("GCD of 48 and 18:", MathUtils.gcd(48, 18));
}

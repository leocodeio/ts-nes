/**
 * Simple Calculator - Test file for NES processing
 * This file has incomplete functionality that NES can improve
 */

export class Calculator {
  private value: number = 0;

  add(x: number): this {
    this.value += x;
    return this;
  }

  // <|cursor|> - Missing subtract method

  getValue(): number {
    return this.value;
  }
}

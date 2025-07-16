"""
Sample Python file for testing NES suggestions
This file demonstrates various scenarios where AI can provide helpful suggestions
"""

import math
from typing import List, Optional, Union, Dict, Any
from abc import ABC, abstractmethod


class Shape(ABC):
    """Abstract base class for geometric shapes"""
    
    def __init__(self, name: str):
        self.name = name
    
    @abstractmethod
    def area(self) -> float:
        """Calculate the area of the shape"""
        pass
    
    @abstractmethod
    def perimeter(self) -> float:
        """Calculate the perimeter of the shape"""
        pass
    
    def __str__(self) -> str:
        return f"{self.name}: area={self.area():.2f}, perimeter={self.perimeter():.2f}"


class Rectangle(Shape):
    """Rectangle shape implementation"""
    
    def __init__(self, width: float, height: float):
        super().__init__("Rectangle")
        self.width = width
        self.height = height
    
    def area(self) -> float:
        return self.width * self.height
    
    def perimeter(self) -> float:
        return 2 * (self.width + self.height)


class Circle(Shape):
    """Circle shape implementation"""
    
    def __init__(self, radius: float):
        super().__init__("Circle")
        self.radius = radius
    
    def area(self) -> float:
        return math.pi * self.radius ** 2
    
    def perimeter(self) -> float:
        return 2 * math.pi * self.radius


# TODO: Add Triangle class that implements Shape
# <|cursor|>


class ShapeCalculator:
    """Utility class for shape calculations"""
    
    def __init__(self):
        self.shapes: List[Shape] = []
    
    def add_shape(self, shape: Shape) -> None:
        """Add a shape to the calculator"""
        self.shapes.append(shape)
    
    def total_area(self) -> float:
        """Calculate total area of all shapes"""
        return sum(shape.area() for shape in self.shapes)
    
    def total_perimeter(self) -> float:
        """Calculate total perimeter of all shapes"""
        return sum(shape.perimeter() for shape in self.shapes)
    
    # TODO: Add method to find the largest shape by area
    
    # TODO: Add method to group shapes by type
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get statistics about the shapes"""
        if not self.shapes:
            return {"count": 0, "total_area": 0, "total_perimeter": 0}
        
        areas = [shape.area() for shape in self.shapes]
        perimeters = [shape.perimeter() for shape in self.shapes]
        
        return {
            "count": len(self.shapes),
            "total_area": sum(areas),
            "total_perimeter": sum(perimeters),
            "average_area": sum(areas) / len(areas),
            "average_perimeter": sum(perimeters) / len(perimeters),
            "max_area": max(areas),
            "min_area": min(areas),
        }


def create_sample_shapes() -> List[Shape]:
    """Create a list of sample shapes for testing"""
    shapes = [
        Rectangle(5, 3),
        Circle(2),
        Rectangle(4, 4),  # Square
        Circle(1.5),
    ]
    return shapes


# TODO: Add function to load shapes from a file

# TODO: Add function to save shapes to a file


class MathUtils:
    """Utility functions for mathematical operations"""
    
    @staticmethod
    def is_perfect_square(n: int) -> bool:
        """Check if a number is a perfect square"""
        if n < 0:
            return False
        root = int(math.sqrt(n))
        return root * root == n
    
    @staticmethod
    def fibonacci(n: int) -> List[int]:
        """Generate Fibonacci sequence up to n terms"""
        if n <= 0:
            return []
        elif n == 1:
            return [0]
        elif n == 2:
            return [0, 1]
        
        fib = [0, 1]
        for i in range(2, n):
            fib.append(fib[i-1] + fib[i-2])
        return fib
    
    # TODO: Add factorial function
    
    # TODO: Add prime number checker
    
    @staticmethod
    def gcd(a: int, b: int) -> int:
        """Calculate greatest common divisor using Euclidean algorithm"""
        while b:
            a, b = b, a % b
        return abs(a)


def main():
    """Main function to demonstrate the shape calculator"""
    print("Shape Calculator Demo")
    print("=" * 30)
    
    # Create calculator and add shapes
    calculator = ShapeCalculator()
    shapes = create_sample_shapes()
    
    for shape in shapes:
        calculator.add_shape(shape)
        print(f"Added: {shape}")
    
    print(f"\nTotal area: {calculator.total_area():.2f}")
    print(f"Total perimeter: {calculator.total_perimeter():.2f}")
    
    # Print statistics
    stats = calculator.get_statistics()
    print(f"\nStatistics:")
    for key, value in stats.items():
        if isinstance(value, float):
            print(f"  {key}: {value:.2f}")
        else:
            print(f"  {key}: {value}")
    
    # Test MathUtils
    print(f"\nMath Utils Demo:")
    print(f"Is 16 a perfect square? {MathUtils.is_perfect_square(16)}")
    print(f"Is 15 a perfect square? {MathUtils.is_perfect_square(15)}")
    print(f"Fibonacci(10): {MathUtils.fibonacci(10)}")
    print(f"GCD(48, 18): {MathUtils.gcd(48, 18)}")


if __name__ == "__main__":
    main()

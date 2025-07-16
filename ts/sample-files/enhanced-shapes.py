"""
Enhanced Shapes Module - Test file for NES processing
This file demonstrates how NES can suggest improvements and completions
"""

import math
from typing import List, Optional, Union, Dict, Any, Tuple
from abc import ABC, abstractmethod


class Shape(ABC):
    """Abstract base class for geometric shapes"""
    
    def __init__(self, name: str, color: str = "white"):
        self.name = name
        self.color = color
        self._created_at = None
    
    @abstractmethod
    def area(self) -> float:
        """Calculate the area of the shape"""
        pass
    
    @abstractmethod
    def perimeter(self) -> float:
        """Calculate the perimeter of the shape"""
        pass
    
    def __str__(self) -> str:
        return f"{self.name} ({self.color}): area={self.area():.2f}, perimeter={self.perimeter():.2f}"
    
    def get_info(self) -> Dict[str, Any]:
        """Get comprehensive information about the shape"""
        return {
            'name': self.name,
            'color': self.color,
            'area': self.area(),
            'perimeter': self.perimeter(),
            'type': self.__class__.__name__
        }


class Circle(Shape):
    """Circle shape implementation"""
    
    def __init__(self, radius: float, color: str = "white"):
        super().__init__("Circle", color)
        if radius <= 0:
            raise ValueError("Radius must be positive")
        self.radius = radius
    
    def area(self) -> float:
        return math.pi * self.radius ** 2
    
    def perimeter(self) -> float:
        return 2 * math.pi * self.radius
    
    def diameter(self) -> float:
        return 2 * self.radius


class Rectangle(Shape):
    """Rectangle shape implementation"""
    
    def __init__(self, width: float, height: float, color: str = "white"):
        super().__init__("Rectangle", color)
        if width <= 0 or height <= 0:
            raise ValueError("Width and height must be positive")
        self.width = width
        self.height = height
    
    def area(self) -> float:
        return self.width * self.height
    
    def perimeter(self) -> float:
        return 2 * (self.width + self.height)


# TODO: Add Triangle class with proper area and perimeter calculations
# <|cursor|>


class ShapeCalculator:
    """Utility class for performing calculations on multiple shapes"""
    
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
    
    def get_largest_shape(self) -> Optional[Shape]:
        """Get the shape with the largest area"""
        if not self.shapes:
            return None
        return max(self.shapes, key=lambda s: s.area())
    
    def filter_by_color(self, color: str) -> List[Shape]:
        """Get all shapes of a specific color"""
        return [shape for shape in self.shapes if shape.color == color]


def create_sample_shapes() -> List[Shape]:
    """Create a collection of sample shapes for testing"""
    return [
        Circle(5.0, "red"),
        Rectangle(4.0, 6.0, "blue"),
        Circle(3.0, "green"),
        Rectangle(2.0, 8.0, "red")
    ]


if __name__ == "__main__":
    # Example usage
    calculator = ShapeCalculator()
    
    for shape in create_sample_shapes():
        calculator.add_shape(shape)
        print(shape)
    
    print(f"\nTotal area: {calculator.total_area():.2f}")
    print(f"Total perimeter: {calculator.total_perimeter():.2f}")
    
    largest = calculator.get_largest_shape()
    if largest:
        print(f"Largest shape: {largest}")

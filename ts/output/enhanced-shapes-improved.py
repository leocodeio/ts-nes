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

import numpy as np
import math
from PIL import Image, ImageDraw, ImageFont

def circle_formation(n, radius=20, height=0):
    """Creates a horizontal ring of drones."""
    targets = []
    for i in range(n):
        angle = 2 * math.pi * i / n
        x = radius * math.cos(angle)
        y = height
        z = radius * math.sin(angle)
        targets.append(np.array([x, y, z]))
    return targets

def dna_helix_formation(n, radius=10, height_step=0.2):
    """Creates a double helix structure (Artistic Show)."""
    targets = []
    for i in range(n):
        # Split drones into two intertwined strands
        strand = 1 if i % 2 == 0 else -1
        progress = (i / n)
        angle = progress * math.pi * 8  # 4 full revolutions
        
        x = strand * radius * math.cos(angle)
        z = strand * radius * math.sin(angle)
        y = (progress - 0.5) * (n * height_step) # Centered on Y-axis
        
        targets.append(np.array([x, y, z]))
    return targets

def fireworks_formation(n, radius=40):
    """Distributes drones in a spherical explosion pattern (Artistic Show)."""
    targets = []
    for i in range(n):
        # Fibonacci Sphere Algorithm for even distribution
        phi = math.acos(1 - 2 * (i / n))
        theta = math.sqrt(n * math.pi) * phi
        
        x = radius * math.cos(theta) * math.sin(phi)
        y = radius * math.sin(theta) * math.sin(phi) + 20 # Elevated 20m
        z = radius * math.cos(phi)
        
        targets.append(np.array([x, y, z]))
    return targets

def grid_formation(n, spacing=3):
    """Creates a 3D block of drones using your specific cubic logic."""
    size = int(math.ceil(n ** (1/3)))
    targets = []
    for x in range(size):
        for y in range(size):
            for z in range(size):
                if len(targets) >= n:
                    return targets
                targets.append(
                    np.array([
                        (x - size / 2) * spacing,
                        (y - size / 2) * spacing,
                        (z - size / 2) * spacing,
                    ])
                )
    return targets

def text_formation(text, max_points, scale=0.5, depth=2):
    """Renders text into a 3D drone cloud using PIL and Numpy."""
    img_size = (400, 150)
    img = Image.new("L", img_size, 0)
    draw = ImageDraw.Draw(img)

    
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 100)
    except:
        try:
            font = ImageFont.truetype("arial.ttf", 100)
        except:
            font = ImageFont.load_default()

    # Center text in the image
    bbox = draw.textbbox((0, 0), text, font=font)
    x_offset = (img_size[0] - (bbox[2] - bbox[0])) // 2
    y_offset = (img_size[1] - (bbox[3] - bbox[1])) // 2
    draw.text((x_offset, y_offset), text, 255, font=font)

    # Convert image to coordinates
    pixels = np.array(img)
    points = np.argwhere(pixels > 0)

 
    if len(points) > max_points:
        points = points[np.linspace(0, len(points) - 1, max_points).astype(int)]

    targets = []
    for y, x in points:
        targets.append(
            np.array([
                (x - img_size[0] / 2) * scale,
                (img_size[1] / 2 - y) * scale,
                np.random.uniform(-depth, depth), # Adds 3D thickness to text
            ])
        )

    return targets
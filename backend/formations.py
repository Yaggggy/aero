import numpy as np
import math
from PIL import Image, ImageDraw, ImageFont

def circle_formation(n, radius=20, height=0):
    targets = []
    for i in range(n):
        angle = 2 * math.pi * i / n
        x = radius * math.cos(angle)
        y = height
        z = radius * math.sin(angle)
        targets.append(np.array([x, y, z]))
    return targets


def grid_formation(n, spacing=3):
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
    img_size = (400, 150)
    img = Image.new("L", img_size, 0)
    draw = ImageDraw.Draw(img)

    try:
        font = ImageFont.truetype("arial.ttf", 100)
    except:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), text, font=font)
    x_offset = (img_size[0] - (bbox[2] - bbox[0])) // 2
    y_offset = (img_size[1] - (bbox[3] - bbox[1])) // 2

    draw.text((x_offset, y_offset), text, 255, font=font)

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
                np.random.uniform(-depth, depth),
            ])
        )

    return targets
import numpy as np
import math

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



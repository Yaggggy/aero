from dataclasses import dataclass
import numpy as np

@dataclass
class Drone:
    id: int
    position: np.ndarray
    velocity: np.ndarray
    target: np.ndarray

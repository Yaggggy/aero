import numpy as np
from backend.app.drone import Drone
from backend.app.formations import (
    circle_formation, grid_formation, text_formation, 
    dna_helix_formation, fireworks_formation
)

class SwarmEngine:
    """
    Core Physics Engine: Manages 1000 drones using Numpy for high-performance 
    vector calculations. Handles smooth LERP-style movement and target switching.
    """
    def __init__(self, drone_count=1000):
        self.dt = 1/60  # Fixed time step for 60fps simulation
        self.max_speed = 5.0
        # Initialize drones at random positions within a spawn cube
        self.drones = [
            Drone(i, np.random.uniform(-10, 10, 3), np.zeros(3), np.zeros(3)) 
            for i in range(drone_count)
        ]
        self.set_formation("circle")

    def set_formation(self, name, value=None):
        """
        Updates the target coordinates for the entire swarm.
        Supports artistic DNA and Firework modes.
        """
        n = len(self.drones)
        
        # Formation Lookup Table
        if name == "circle":
            targets = circle_formation(n)
        elif name == "grid":
            targets = grid_formation(n)
        elif name == "dna_helix":
            targets = dna_helix_formation(n)
        elif name == "fireworks":
            targets = fireworks_formation(n)
        elif name == "text" and value:
            targets = text_formation(value, n)
        else:
            return

        # Assign calculated targets to drone dataclasses
        for d, t in zip(self.drones, targets):
            d.target = t

    def tick(self):
        """
        Per-frame physics update. 
        Calculates steering forces and velocity updates for smooth flight.
        """
        for d in self.drones:
            # 1. Calculate Vector to Target
            direction = d.target - d.position
            distance = np.linalg.norm(direction)

            if distance > 0.1:
                # Arrive behavior: Move at max speed toward the target
                desired_vel = (direction / distance) * self.max_speed
                # Smoothly interpolate velocity (steering)
                steer = desired_vel - d.velocity
                d.velocity += steer * 0.05 

            # 3. Speed Limit (Normalization)
            speed = np.linalg.norm(d.velocity)
            if speed > self.max_speed:
                d.velocity = (d.velocity / speed) * self.max_speed

            # 4. Final Position Integration
            d.position += d.velocity * self.dt

    def snapshot(self):
        
        return [
            {
                "id": d.id,
                "x": round(float(d.position[0]), 2),
                "y": round(float(d.position[1]), 2),
                "z": round(float(d.position[2]), 2),
            }
            for d in self.drones
        ]
import numpy as np
from drone import Drone

class SwarmEngine:
    def __init__(self, drone_count=500):
        self.dt = 1 / 60
        self.bounds = 50
        self.drones = self._init_drones(drone_count)

    def _init_drones(self, n):
        drones = []
        for i in range(n):
            pos = np.random.uniform(-20, 20, size=3)
            vel = np.zeros(3)
            drones.append(Drone(i, pos, vel))
        return drones

    def tick(self):
        for d in self.drones:
            direction = -d.position
            d.velocity += direction * 0.01
            speed = np.linalg.norm(d.velocity)
            if speed > 2:
                d.velocity = d.velocity / speed * 2
            d.position += d.velocity * self.dt

    def snapshot(self):
        return [
            {
                "id": d.id,
                "x": float(d.position[0]),
                "y": float(d.position[1]),
                "z": float(d.position[2]),
            }
            for d in self.drones
        ]

import numpy as np
from drone import Drone
from formations import circle_formation

class SwarmEngine:
    def __init__(self, drone_count=1000):
        self.dt = 1 / 60
        self.max_speed = 5.0
        self.drones = self._init_drones(drone_count)
        self.set_circle()

    def _init_drones(self, n):
        drones = []
        targets = circle_formation(n)
        for i in range(n):
            pos = np.random.uniform(-5, 5, size=3)
            vel = np.zeros(3)
            drones.append(Drone(i, pos, vel, targets[i]))
        return drones

    def set_circle(self):
        targets = circle_formation(len(self.drones))
        for d, t in zip(self.drones, targets):
            d.target = t

    def tick(self):
        for d in self.drones:
            direction = d.target - d.position
            distance = np.linalg.norm(direction)

            if distance > 0.1:
                desired_velocity = direction / distance * self.max_speed
                steer = desired_velocity - d.velocity
                d.velocity += steer * 0.05

            speed = np.linalg.norm(d.velocity)
            if speed > self.max_speed:
                d.velocity = d.velocity / speed * self.max_speed

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

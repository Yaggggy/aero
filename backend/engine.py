import numpy as np
from tomlkit import value
from drone import Drone
from formations import circle_formation, grid_formation , text_formation

class SwarmEngine:
    def __init__(self, drone_count=1000):
        self.dt = 1 / 60
        self.max_speed = 5.0
        self.drones = self._init_drones(drone_count)
        self.set_formation("circle")

    def _init_drones(self, n):
        drones = []
        for i in range(n):
            pos = np.random.uniform(-5, 5, size=3)
            vel = np.zeros(3)
            drones.append(Drone(i, pos, vel, pos.copy()))
        return drones

    def set_formation(self, name, value=None):
        if name == "circle":
            targets = circle_formation(len(self.drones))

        elif name == "grid":
            targets = grid_formation(len(self.drones))

        elif name == "text":
            if not value:
                return
            targets = text_formation(value, len(self.drones))

        else:
            raise ValueError("Unknown formation")

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

    def update(self, dt=0.1):
        dt *= self.speed_multiplier
        force = (self.target - self.pos) * 0.6
        self.vel = self.vel * 0.85 + force * dt
        self.pos += self.vel * dt
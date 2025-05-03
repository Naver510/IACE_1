import random
import time

def generate_sensor_data():
    data = {
        "temperatura": round(random.uniform(18.0, 25.0), 2),        # °C
        "predkosc_obrotowa": random.randint(0, 3000),               # RPM
        "cisnienie": round(random.uniform(990.0, 1025.0), 2),       # hPa
        "wilgotnosc": round(random.uniform(40.0, 60.0), 2)          # %
    }
    return data

if __name__ == "__main__":
    while True:
        sensor_data = generate_sensor_data()
        print(sensor_data)
        time.sleep(1)                                               # every second


import random
import time
import requests
import os

API_URL = "http://example.com/sensor/{sensorAPIkey}/reading" 
SENSOR_API_KEY = "your_sensor_api_key" 

def generate_sensor_data():
    data = {
        "temperatura": round(random.uniform(18.0, 25.0), 2),        # °C
        "predkosc_obrotowa": random.randint(0, 3000),               # RPM
        "cisnienie": round(random.uniform(990.0, 1025.0), 2),       # hPa
        "wilgotnosc": round(random.uniform(40.0, 60.0), 2)          # %
    }
    return data

def send_data_to_api(sensor_key, value):
    try:
        # prepare payload
        payload = {
            "timestamp": int(time.time()),  
            "value": value
        }
        url = API_URL.format(sensorAPIkey=sensor_key)
        headers = {"Content-Type": "application/json"}

        # send POST req
        response = requests.post(url, json=payload, headers=headers)

        # response 
        if response.status_code == 200:
            print(f"Dane wysłane pomyślnie: {payload}")
        else:
            print(f"Błąd podczas wysyłania danych: {response.status_code}, {response.text}")
    except requests.RequestException as e:
        print(f"Błąd połączenia z API: {e}")

if __name__ == "__main__":
    # check for coconut
    while not os.path.exists("coconut.png"):
        print("Critical error: coconut.png not found.")
        time.sleep(1)  # Sprawdzaj co sekundę

    print("Coconut found. Starting sensor data generation...")

    while True:
        sensor_data = generate_sensor_data()
        print(sensor_data)

        # send each sensor data to the API
        for sensor, value in sensor_data.items():
            send_data_to_api(SENSOR_API_KEY, {"sensor": sensor, "value": value})

        time.sleep(1)  # every second

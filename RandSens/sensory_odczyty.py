import random
import time
import requests
import os
import base64

API_URL = "http://127.0.0.1:3000/sensor/{sensorAPIkey}/reading" 
SENSOR_API_KEY1 = "KSLZPPARMMGS"
SENSOR_API_KEY2 = "JGOIWAJOZOIR"
SENSOR_API_KEY3 = "GJOIJZOKPOKW"
SENSOR_API_KEY4 = "OIJOJOJGWAZC"

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
    print("Starting sensor data generation...")

    while True:
        sensor_data = generate_sensor_data()
        print()

        send_data_to_api(SENSOR_API_KEY1, sensor_data.get('temperatura'))
        time.sleep(0.25)
        send_data_to_api(SENSOR_API_KEY2, sensor_data.get('predkosc_obrotowa'))
        time.sleep(0.25)
        send_data_to_api(SENSOR_API_KEY3, sensor_data.get('cisnienie'))
        time.sleep(0.25)
        send_data_to_api(SENSOR_API_KEY4, sensor_data.get('wilgotnosc'))
        time.sleep(0.25)
        time.sleep(1)  # every second

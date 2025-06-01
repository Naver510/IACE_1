import random
import time
import requests
import os
import base64
from datetime import datetime, timedelta

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

def generate_last_month_data():
    print("Generowanie danych dla poprzedniego miesiąca...")

    now = datetime.now()
    first_day_this_month = datetime(now.year, now.month, 1)
    last_month_last_day = first_day_this_month - timedelta(days=1)
    last_month_first_day = datetime(last_month_last_day.year, last_month_last_day.month, 1)

    current = last_month_first_day
    while current <= last_month_last_day:
        for hour in range(0, 24):
            dt = current.replace(hour=hour, minute=0, second=0)
            timestamp = int(dt.timestamp())
            sensor_data = generate_sensor_data()
            send_data_to_api(SENSOR_API_KEY1, {"timestamp": timestamp, "value": sensor_data['temperatura']})
            send_data_to_api(SENSOR_API_KEY2, {"timestamp": timestamp, "value": sensor_data['predkosc_obrotowa']})
            send_data_to_api(SENSOR_API_KEY3, {"timestamp": timestamp, "value": sensor_data['cisnienie']})
            send_data_to_api(SENSOR_API_KEY4, {"timestamp": timestamp, "value": sensor_data['wilgotnosc']})
            time.sleep(0.01)  # aby nie zalać serwera
        current += timedelta(days=1)
    print("Zakończono generowanie danych.")

# Modyfikacja send_data_to_api, by obsłużyć payload z timestampem:
def send_data_to_api(sensor_key, value):
    try:
        if isinstance(value, dict) and "timestamp" in value:
            payload = value
        else:
            payload = {
                "timestamp": int(time.time()),
                "value": value
            }
        url = API_URL.format(sensorAPIkey=sensor_key)
        headers = {"Content-Type": "application/json"}
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            print(f"Dane wysłane pomyślnie: {payload}")
        else:
            print(f"Błąd podczas wysyłania danych: {response.status_code}, {response.text}")
    except requests.RequestException as e:
        print(f"Błąd połączenia z API: {e}")

if __name__ == "__main__":
    print("Starting sensor data generation...")

    mode = input("Wpisz 'miesiac' aby wygenerować dane z poprzedniego miesiąca, lub Enter aby generować na żywo: ")
    if mode.strip().lower() == "miesiac":
        generate_last_month_data()
    else:
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


import time
import json
import urllib.request
import urllib.error

# PeerRank backend address
# API_URL = "http://127.0.0.1:8000"

API_URL = "http://127.0.0.1:8000"
# Registered peer ID
# PEER_ID = "dcd24294-c999-4bee-a983-3ce93c624b6b"
PEER_ID = "428b0436-1908-467c-8e11-60f097caf186"

# Send heartbeat every 20 seconds
HEARTBEAT_INTERVAL = 20


def send_heartbeat():
    url = f"{API_URL}/peers/heartbeat/{PEER_ID}"

    request = urllib.request.Request(
        url,
        data=b"",
        method="POST"
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=10
        ) as response:

            result = json.loads(
                response.read().decode("utf-8")
            )

            print(
                f"Heartbeat successful | "
                f"Status: {result['status']} | "
                f"Time: {result['last_seen']}"
            )

    except urllib.error.HTTPError as error:
        print(f"Server error: {error.code}")

    except urllib.error.URLError as error:
        print(f"Connection failed: {error.reason}")

    except Exception as error:
        print(f"Unexpected error: {error}")


if __name__ == "__main__":
    print("PeerRank Agent Started")
    print(f"Peer ID: {PEER_ID}")
    print("Sending heartbeat every 20 seconds...")

    while True:
        send_heartbeat()
        time.sleep(HEARTBEAT_INTERVAL)

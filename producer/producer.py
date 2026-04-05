import socket
import json
from kafka import KafkaProducer
import time
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
SOCKET_SERVER = os.getenv('SOCKET_SERVER', '0.0.0.0')
SOCKET_PORT = int(os.getenv('SOCKET_PORT', 5050))
KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka:9092').split(',')
KAFKA_TOPIC = os.getenv('KAFKA_TOPIC', 'shipment_data')
BUFFER_SIZE = int(os.getenv('BUFFER_SIZE', 4096))

def create_kafka_producer():
    """Create and return a Kafka producer instance."""
    print("Starting Kafka producer connection...")
    try:
        producer = KafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            acks='all',
            retries=3
        )
        print("Kafka producer connected")
        return producer
    except Exception as e:
        print(f"Failed to create Kafka producer: {e}")
        raise

def connect_to_socket_server(host, port):
    """Connect to the socket server and return the socket object."""
    print(f"Starting socket server connection to {host}:{port}...")
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    while True:
        try:
            sock.connect((host, port))
            print(f"Connected to socket server at {host}:{port}")
            return sock
        except ConnectionRefusedError:
            print("Connection refused. Retrying in 5 seconds...")
            time.sleep(5)
        except Exception as e:
            print(f"Error connecting to socket server: {e}")
            raise

def process_messages(sock, producer):
    """Continuously receive and process messages from the socket server."""
    print("Starting message processing...")
    buffer = ""
    while True:
        try:
            # Receive data
            data = sock.recv(BUFFER_SIZE)
            if not data:
                print("Connection closed by server")
                return False

            # Decode and process the data
            buffer += data.decode('utf-8')
            
            # Process complete JSON objects
            while '}' in buffer:
                json_str, _, buffer = buffer.partition('}')
                json_str += '}'
                
                # Parse the JSON data
                message = json.loads(json_str)
                
                # Send to Kafka
                producer.send(KAFKA_TOPIC, value=message)
                producer.flush()
        except socket.error:
            print("Socket connection error")
            return False

def main():
    print("Starting producer...")
    producer = create_kafka_producer()
    
    while True:
        sock = connect_to_socket_server(SOCKET_SERVER, SOCKET_PORT)
        try:
            should_reconnect = process_messages(sock, producer)
            if not should_reconnect:
                break
        except KeyboardInterrupt:
            print("Shutting down...")
            break
        finally:
            sock.close()
            print("Socket connection closed")
            
        # Wait before reconnecting
        time.sleep(5)
    
    producer.close()
    print("Producer ended")

if __name__ == "__main__":
    main()
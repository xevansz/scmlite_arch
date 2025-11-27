import socket
import json
from kafka import KafkaProducer
import logging
import time
import os
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
SOCKET_SERVER = os.getenv('SOCKET_SERVER', '127.0.1.1')
SOCKET_PORT = int(os.getenv('SOCKET_PORT', 5050))
KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092').split(',')
KAFKA_TOPIC = os.getenv('KAFKA_TOPIC', 'shipment_data')
BUFFER_SIZE = int(os.getenv('BUFFER_SIZE', 4096))

def create_kafka_producer():
    """Create and return a Kafka producer instance."""
    try:
        producer = KafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            acks='all',
            retries=3
        )
        logger.info("Successfully connected to Kafka")
        return producer
    except Exception as e:
        logger.error(f"Failed to create Kafka producer: {e}")
        raise

def connect_to_socket_server(host, port):
    """Connect to the socket server and return the socket object."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    while True:
        try:
            sock.connect((host, port))
            logger.info(f"Connected to socket server at {host}:{port}")
            return sock
        except ConnectionRefusedError:
            logger.warning("Connection refused. Retrying in 5 seconds...")
            time.sleep(5)
        except Exception as e:
            logger.error(f"Error connecting to socket server: {e}")
            raise

def process_messages(sock, producer):
    """Continuously receive and process messages from the socket server."""
    buffer = ""
    while True:
        try:
            # Receive data
            data = sock.recv(BUFFER_SIZE)
            if not data:
                logger.warning("Connection closed by server")
                return False

            # Decode and process the data
            buffer += data.decode('utf-8')
            
            # Process complete JSON objects
            while '}' in buffer:
                json_str, _, buffer = buffer.partition('}')
                json_str += '}'
                
                try:
                    # Parse the JSON data
                    message = json.loads(json_str)
                    logger.info(f"Received message: {message}")
                    
                    # Send to Kafka
                    producer.send(KAFKA_TOPIC, value=message)
                    producer.flush()
                    logger.info(f"Sent to Kafka topic '{KAFKA_TOPIC}': {message}")
                    
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON: {json_str}")
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
        
        except socket.error as e:
            logger.error(f"Socket error: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return True  # Return True to attempt reconnection

def main():
    producer = create_kafka_producer()
    
    while True:
        sock = connect_to_socket_server(SOCKET_SERVER, SOCKET_PORT)
        try:
            should_reconnect = process_messages(sock, producer)
            if not should_reconnect:
                break
        except KeyboardInterrupt:
            logger.info("Shutting down...")
            break
        except Exception as e:
            logger.error(f"Unexpected error in main loop: {e}")
        finally:
            sock.close()
            logger.info("Socket connection closed")
            
        # Wait before reconnecting
        time.sleep(5)
    
    producer.close()
    logger.info("Kafka producer closed")

if __name__ == "__main__":
    main()
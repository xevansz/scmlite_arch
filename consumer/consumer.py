import json
import signal
import ssl
import sys
from kafka import KafkaConsumer
from kafka.errors import KafkaError, NoBrokersAvailable
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, PyMongoError
from time import sleep
from dotenv import load_dotenv
import os

load_dotenv()

# Configuration
KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka:9092').split(',')
KAFKA_TOPIC = os.getenv('KAFKA_TOPIC', 'shipment_data')
MONGO_URI = os.getenv('MONGO_URI')
DB_NAME = os.getenv('DB_NAME', 'scmlitedb')
COLLECTION_NAME = os.getenv('COLLECTION_NAME', 'shipment_data')

class KafkaMongoConsumer:
    def __init__(self):
        self.consumer = None
        self.mongo_client = None
        self.collection = None
        self.running = True
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._shutdown)
        signal.signal(signal.SIGTERM, self._shutdown)
        
        self._setup_kafka_consumer()
        self._setup_mongodb()

    def _setup_kafka_consumer(self, max_retries=5, retry_delay=5):
        """Initialize Kafka consumer with retry logic."""
        print("Starting Kafka consumer connection...")
        retry_count = 0
        while retry_count < max_retries:
            try:
                self.consumer = KafkaConsumer(
                    KAFKA_TOPIC,
                    bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                    value_deserializer=lambda x: self._safe_json_loads(x),
                    auto_offset_reset='earliest',
                    enable_auto_commit=True,
                    group_id='shipment_consumer_group'
                )
                print("Kafka consumer connected")
                return
            except NoBrokersAvailable:
                retry_count += 1
                if retry_count == max_retries:
                    print("Failed to connect to Kafka after multiple attempts")
                    raise
                print(f"Kafka broker not available. Retrying in {retry_delay} seconds... (Attempt {retry_count}/{max_retries})")
                sleep(retry_delay)
            except Exception as e:
                print(f"Error setting up Kafka consumer: {e}")
                raise

    def _setup_mongodb(self, max_retries=5, retry_delay=5):
        """Initialize MongoDB connection with retry logic."""
        print("Starting MongoDB connection...")
        retry_count = 0
        while retry_count < max_retries:
            try:
                self.mongo_client = MongoClient(
                    MONGO_URI,
                    serverSelectionTimeoutMS=5000,
                    connectTimeoutMS=30000,
                    socketTimeoutMS=30000,
                    maxPoolSize=10
                )
                # Force connection to verify it works
                self.mongo_client.server_info()
                db = self.mongo_client[DB_NAME]
                self.collection = db[COLLECTION_NAME]
                print(f"MongoDB connected. Database: {DB_NAME}, Collection: {COLLECTION_NAME}")
                return
            except ConnectionFailure as e:
                retry_count += 1
                if retry_count == max_retries:
                    print("Failed to connect to MongoDB after multiple attempts")
                    raise
                print(f"MongoDB connection failed. Retrying in {retry_delay} seconds... (Attempt {retry_count}/{max_retries})")
                sleep(retry_delay)
            except Exception as e:
                print(f"Error setting up MongoDB: {e}")
                raise

    @staticmethod
    def _safe_json_loads(json_str):
        """Safely deserialize JSON string."""
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            return None

    def _process_message(self, message):
        """Process a single message and insert into MongoDB."""
        if not message.value:
            return

        data = message.value
        if not isinstance(data, dict):
            return
            
        # Insert into MongoDB
        self.collection.insert_one(data)

    def _shutdown(self, signum, frame):
        """Handle shutdown signals."""
        print("Shutdown signal received. Closing connections...")
        self.running = False
        self.close()
        sys.exit(0)

    def close(self):
        """Close all connections."""
        if self.consumer:
            self.consumer.close()
            print("Kafka consumer closed")
        
        if self.mongo_client:
            self.mongo_client.close()
            print("MongoDB connection closed")

    def run(self):
        """Main consumer loop."""
        print("Starting consumer loop...")
        
        for message in self.consumer:
            if not self.running:
                break
            self._process_message(message)
        
        self.close()
        print("Consumer loop ended")

def main():
    print("Starting consumer...")
    consumer = None
    while True:
        try:
            consumer = KafkaMongoConsumer()
            consumer.run()
        except KeyboardInterrupt:
            print("Shutdown requested. Exiting...")
            if consumer:
                consumer.close()
            break
        except Exception as e:
            print(f"Consumer failed: {e}")
            print("Restarting consumer in 10 seconds...")
            sleep(10)
    print("Consumer ended")

if __name__ == "__main__":
    main()
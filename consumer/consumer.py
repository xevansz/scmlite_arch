import json
import logging
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('consumer.log')
    ]
)
logger = logging.getLogger(__name__)

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
                logger.info("Successfully connected to Kafka")
                return
            except NoBrokersAvailable:
                retry_count += 1
                if retry_count == max_retries:
                    logger.error("Failed to connect to Kafka after multiple attempts")
                    raise
                logger.warning(f"Kafka broker not available. Retrying in {retry_delay} seconds... (Attempt {retry_count}/{max_retries})")
                sleep(retry_delay)
            except Exception as e:
                logger.error(f"Error setting up Kafka consumer: {e}")
                raise

    def _setup_mongodb(self, max_retries=5, retry_delay=5):
        """Initialize MongoDB connection with retry logic."""
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
                logger.info(f"Successfully connected to MongoDB. Database: {DB_NAME}, Collection: {COLLECTION_NAME}")
                return
            except ConnectionFailure as e:
                retry_count += 1
                if retry_count == max_retries:
                    logger.error("Failed to connect to MongoDB after multiple attempts")
                    raise
                logger.warning(f"MongoDB connection failed. Retrying in {retry_delay} seconds... (Attempt {retry_count}/{max_retries})")
                sleep(retry_delay)
            except Exception as e:
                logger.error(f"Error setting up MongoDB: {e}")
                raise

    @staticmethod
    def _safe_json_loads(json_str):
        """Safely deserialize JSON string."""
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            logger.warning(f"Invalid JSON received: {json_str}. Error: {e}")
            return None

    def _process_message(self, message):
        """Process a single message and insert into MongoDB."""
        if not message.value:
            logger.warning("Received empty or invalid message")
            return

        try:
            data = message.value
            if not isinstance(data, dict):
                logger.warning(f"Unexpected message format: {data}")
                return
                
            # Insert into MongoDB
            result = self.collection.insert_one(data)
            logger.info(f"Inserted document with ID: {result.inserted_id}")
            
        except PyMongoError as e:
            logger.error(f"MongoDB error: {e}")
        except Exception as e:
            logger.error(f"Error processing message: {e}")

    def _shutdown(self, signum, frame):
        """Handle shutdown signals."""
        logger.info("Shutdown signal received. Closing connections...")
        self.running = False
        self.close()
        sys.exit(0)

    def close(self):
        """Close all connections."""
        if self.consumer:
            try:
                self.consumer.close()
                logger.info("Kafka consumer closed")
            except Exception as e:
                logger.error(f"Error closing Kafka consumer: {e}")
        
        if self.mongo_client:
            try:
                self.mongo_client.close()
                logger.info("MongoDB connection closed")
            except Exception as e:
                logger.error(f"Error closing MongoDB connection: {e}")

    def run(self):
        """Main consumer loop."""
        logger.info("Starting Kafka consumer...")
        
        try:
            for message in self.consumer:
                if not self.running:
                    break
                    
                logger.debug(f"Received message: {message.value}")
                self._process_message(message)
                
        except KafkaError as e:
            logger.error(f"Kafka error: {e}")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
        finally:
            self.close()

def main():
    consumer = None
    while True:
        try:
            consumer = KafkaMongoConsumer()
            consumer.run()
        except KeyboardInterrupt:
            logger.info("Shutdown requested. Exiting...")
            if consumer:
                consumer.close()
            break
        except Exception as e:
            logger.error(f"Consumer failed: {e}")
            logger.info("Restarting consumer in 10 seconds...")
            sleep(10)

if __name__ == "__main__":
    main()
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import logging
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class Database:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize_connection()
        return cls._instance
    
    def _initialize_connection(self):
        """Initialize MongoDB connection."""
        try:
            self.client = MongoClient(
                os.getenv('MONGO_URI'),
                serverSelectionTimeoutMS=5000
            )
            
            # Test the connection
            self.client.server_info()
            self.db = self.client[os.getenv('DB_NAME')]
            logger.info("Connected to MongoDB!")
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    def get_collection(self, collection_name: str):
        return self.db[collection_name]
    
    def close_connection(self):
        if hasattr(self, 'client'):
            self.client.close()
            logger.info("MongoDB connection closed")

# Initialize database connection
db = Database()
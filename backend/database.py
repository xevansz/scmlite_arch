from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import logging

logger = logging.getLogger(__name__)

class Database:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize_connection()
        return cls._instance
    
    def _initialize_connection(self):
        try:
            # Connect with authentication in the connection string (preferred method for PyMongo 4.0+)
            self.client = MongoClient(
                "mongodb://admin:password@localhost:27017/scmlitedb?authSource=admin",
                serverSelectionTimeoutMS=5000
            )
            
            # Test the connection with authentication
            self.client.admin.command('ping')
            self.db = self.client["scmlitedb"]
            
            logger.info("Successfully connected to MongoDB with authentication")
            
        except ConnectionFailure as e:
            logger.error("Failed to connect to MongoDB: %s", e)
            logger.error("Please ensure MongoDB is running and authentication is properly set up")
            raise
    
    def get_collection(self, collection_name: str):
        return self.db[collection_name]
    
    def close_connection(self):
        if hasattr(self, 'client'):
            self.client.close()
            logger.info("MongoDB connection closed")

# Initialize database connection
db = Database()
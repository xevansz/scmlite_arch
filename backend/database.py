from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv

from pathlib import Path
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class Database:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize_connection()
        return cls._instance
    
    def _initialize_connection(self):
        """Initialize MongoDB connection."""
        print("Starting MongoDB connection...")
        try:
            self.client = MongoClient(
                os.getenv('MONGO_URI'),
                serverSelectionTimeoutMS=5000
            )
            
            self.client.server_info()
            self.db = self.client[os.getenv('DB_NAME', 'scmlitedb')]
            print("MongoDB connected")
        except ConnectionFailure as e:
            print(f"Failed to connect to MongoDB: {e}")
            raise
    
    def get_collection(self, collection_name: str):
        """Get a collection."""
        return self.db[collection_name]
    
    def create_index(self, collection_name: str, index_key, **kwargs):
        """Create an index on a collection."""
        collection = self.get_collection(collection_name)
        return collection.create_index(index_key, **kwargs)
    
    def close_connection(self):
        """Close the MongoDB connection."""
        if hasattr(self, 'client'):
            self.client.close()
            print("MongoDB connection closed")

# Initialize database connection
db = Database()
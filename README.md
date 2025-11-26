# SCMLite - Real-time Data Pipeline

A real-time data streaming pipeline that processes IoT device data through Kafka and stores it in MongoDB.

## 📋 Project Overview
- **Purpose**: University project for SMD (Software for Mobile and Distributed Systems)
- **Components**:
  - Socket Server: Generates IoT device data
  - Kafka: Message broker for real-time data streaming
  - MongoDB: Persistent storage for processed data
  - Producer/Consumer: Python services for data processing

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Python 3.8+

### 🐳 Docker Setup

1. **Create Docker Network**
   ```bash
   docker network create scmlite-net
   ```

3. **Start MongoDB**
   ```bash
   docker run -d \
     --name mongodb \
     --network scmlite-net \
     -p 27017:27017 \
     -v mongo-data:/data/db \
     -e MONGO_INITDB_ROOT_USERNAME=admin \
     -e MONGO_INITDB_ROOT_PASSWORD=password123 \
     mongo:latest
   ```

4. **Start Zookeeper**
   ```bash
   docker run -d \
     --name zookeeper \
     --network scmlite-net \
     -p 2181:2181 \
     -e ZOOKEEPER_CLIENT_PORT=2181 \
     -e ZOOKEEPER_TICK_TIME=2000 \
     wurstmeister/zookeeper
   ```

6. **Start Kafka**
   ```bash
   docker run -d \
     --name kafka \
     --network scmlite-net \
     -p 9092:9092 \
     -e KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181 \
     -e KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092 \
     -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
     -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
     wurstmeister/kafka:2.13-2.8.1
   ```

## 🛠️ Project Structure
```
scmlite_arch/
├── consumer/           # Kafka consumer service
│   └── consumer.py
├── producer/           # Kafka producer service
│   └── producer.py
├── socker_server/      # Socket server (data source)
│   └── server.py
└── requirements.txt    # Python dependencies
```

## 🚦 Running the Application

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the Producer** (in a new terminal)
   ```bash
   python producer/producer.py
   ```

3. **Start the Consumer** (in another terminal)
   ```bash
   python consumer/consumer.py
   ```

## 🌐 Accessing Data

- **MongoDB**:
  - Host: `localhost:27017`
  - Database: `scmlitedb`
  - Collections: 
    - `users` - For user authentication
    - `shipments_usr` - For shipment information
    - `device_data` - For device telemetry data
  - Credentials: `admin/password123`

- **Kafka**:
  - Bootstrap Server: `localhost:9092`
  - Topic: `shipment_data`

## 📊 Data Format
Example document in MongoDB:
```json
{
  "Battery_Level": 4.79,
  "Device_ID": 1158,
  "First_Sensor_temperature": 28.7,
  "Route_From": "London,UK",
  "Route_To": "Bengaluru, India"
}
```

## 🔧 Troubleshooting
- If services fail to start, check container logs:
  ```bash
  docker logs <container_name>
  ```
- Ensure ports 27017 (MongoDB), 9092 (Kafka), and 2181 (Zookeeper) are available

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


This frontend includes components from [shadcn/ui](https://ui.shadcn.com/) used under [MIT license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md).

This fronted includes photos from [Unsplash](https://unsplash.com) used under [license](https://unsplash.com/license).
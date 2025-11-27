# SCMLite - Supply Chain Management System

A comprehensive supply chain management system with real-time data processing capabilities.

## 📋 Project Overview
- **Purpose**: University project for SMD (Software for Mobile and Distributed Systems)
- **Components**:
  - **Frontend**: Modern web interface built with React
  - **Backend**: FastAPI application serving RESTful APIs
  - **Database**: MongoDB for persistent data storage
  - **Real-time Processing**: Kafka-based data streaming pipeline
  - **Authentication**: Secure user authentication system

## 🚀 Project Structure

```
scmlite_arch/
├── backend/                  # FastAPI backend application
│   ├── models/              # Database models
│   ├── routes/              # API route handlers
│   │   ├── auth_routes.py   # Authentication endpoints
│   │   ├── data_routes.py   # Data access endpoints
│   │   └── shipment_routes.py # Shipment management
│   ├── utils/               # Utility functions
│   ├── database.py          # Database connection setup
│   └── main.py              # FastAPI application entry point
│
├── frontend/                # React frontend application
│   ├── public/              # Static files
│   ├── src/                 # React source code
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── App.tsx          # Main application component
│   │   └── main.tsx         # Application entry point
│   ├── package.json         # Frontend dependencies
│   └── vite.config.ts       # Vite configuration
│
├── producer/                # Kafka producer service
│   └── producer.py          # Produces data to Kafka topics
│
├── consumer/                # Kafka consumer service
│   └── consumer.py          # Consumes and processes data
│
├── socket_server/           # Socket server
│   └── server.py            # Handles real-time device connections
│
├── .env                    # Environment variables
├── .gitignore              # Git ignore rules
├── docker-compose.yml      # Docker Compose configuration
├── requirements.txt        # Python dependencies
└── README.md               # Project documentation
```

## �️ Prerequisites

- Docker and Docker Compose
- Node.js (v14+)
- Python 3.8+
- MongoDB (can be run via Docker)
- Kafka (can be run via Docker)

## 🚀 Quick Start with Docker

1. **Start the application stack**
   ```bash
   docker-compose up -d
   ```

2. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🔧 Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# MongoDB
MONGO_URI=mongodb://admin:password123@localhost:27017/
MONGO_DB=scmlitedb

# FastAPI
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC=shipment_data
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token

### Shipments
- `GET /api/shipments` - Get all shipments
- `GET /api/shipments/{shipment_id}` - Get shipment details
- `POST /api/shipments` - Create a new shipment
- `PUT /api/shipments/{shipment_id}` - Update shipment
- `DELETE /api/shipments/{shipment_id}` - Delete shipment

### Device Data
- `GET /api/data` - Get device telemetry data
- `GET /api/data/{device_id}` - Get data for specific device
- `POST /api/data` - Submit new device data

## 📊 Data Models

### User
```typescript
{
  _id: ObjectId,
  email: string,
  hashed_password: string,
  full_name: string,
  is_active: boolean,
  created_at: DateTime,
  updated_at: DateTime
}
```

### Shipment
```typescript
{
  _id: ObjectId,
  tracking_number: string,
  status: string,
  origin: string,
  destination: string,
  estimated_delivery: DateTime,
  actual_delivery: DateTime,
  created_at: DateTime,
  updated_at: DateTime
}
```

### Device Data
```typescript
{
  _id: ObjectId,
  device_id: string,
  battery_level: number,
  temperature: number,
  humidity: number,
  location: {
    type: 'Point',
    coordinates: [longitude, latitude]
  },
  timestamp: DateTime
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
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
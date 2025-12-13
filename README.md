# SCMLite - Supply Chain Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive supply chain management system with real-time data processing capabilities, built as a university project for SMD (Software for Mobile and Distributed Systems).

## 📋 Table of Contents
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start-with-docker)
- [Development Setup](#-development-setup)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

- **Real-time Tracking**: Monitor shipments and inventory in real-time
- **User Management**: Secure authentication and role-based access control
- **Data Analytics**: Process and analyze supply chain data
- **Modular Architecture**: Microservices-based design for scalability
- **Responsive UI**: Modern React-based frontend with Material-UI
- **RESTful API**: Well-documented endpoints for integration
- **Event-Driven**: Kafka-based event streaming for real-time updates

## 🚀 Project Structure

```
scmlite_arch/
├── backend/                   # FastAPI backend application
│   ├── models/                # Database models
│   ├── routes/                # API route handlers
│   │   ├── auth_routes.py     # Authentication endpoints
│   │   ├── data_routes.py     # Data access endpoints
│   │   └── shipment_routes.py # Shipment management
│   ├── utils/                 # Utility functions
│   ├── database.py            # Database connection setup
│   └── main.py                # FastAPI application entry point
│
├── frontend/                  # React frontend application
│   ├── public/                # Static files
│   ├── src/                   # React source code
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── App.tsx            # Main application component
│   │   └── main.tsx           # Application entry point
│   ├── package.json           # Frontend dependencies
│   └── vite.config.ts         # Vite configuration
│
├── producer/                  # Kafka producer service
│   └── producer.py            # Produces data to Kafka topics
│
├── consumer/                  # Kafka consumer service
│   └── consumer.py            # Consumes and processes data
│
├── socket_server/             # Socket server
│   └── server.py              # Handles real-time device connections
│
├── .env                       # Environment variables
├── .gitignore                 # Git ignore rules
├── docker-compose.yml         # Docker Compose configuration
├── requirements.txt           # Python dependencies
└── README.md                  # Project documentation
```

## �️ Prerequisites

- Docker and Docker Compose
- Node.js (v14+)
- Python 3.8+
- MongoDB (can be run via Docker)
- Kafka (can be run via Docker)

## 🚀 Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/scmlite_arch.git
   cd scmlite_arch
   ```

2. **Create and configure .env file**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

3. **Start the application stack**
   ```bash
   docker-compose up -d --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000 
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - MongoDB: mongodb://localhost:27017 (if exposed)
   - Kafka UI: http://localhost:8080 (if configured)

5. **Check service status**
   ```bash
   docker-compose ps
   ```

## � Development Setup

1. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Kafka Setup**
   ```bash
   # Start Zookeeper and Kafka
   docker-compose -f docker-compose.kafka.yml up -d
   ```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please make sure to update tests as appropriate and follow the [code of conduct](CODE_OF_CONDUCT.md).

## �� Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# MongoDB
MONGO_URI=mongodb://admin:password123@localhost:27017/

# FastAPI
SECRET_KEY=your-secret-key
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

Distributed under the MIT License. See `LICENSE` for more information.

## 🙏 Acknowledgments

- University of [Your University] - SMD Course
- [FastAPI](https://fastapi.tiangolo.com/) - The web framework used
- [React](https://reactjs.org/) - Frontend library
- [MongoDB](https://www.mongodb.com/) - Database
- [Apache Kafka](https://kafka.apache.org/) - Event streaming platform
  "Route_From": "London,UK",
  "Route_To": "Bengaluru, India"

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
# Order Service

E-Commerce Order Management Microservice with **Saga Orchestration Pattern** and **State Machine** for distributed transaction management.

## 📋 Overview

The Order Service is the decision engine of the e-commerce system. It:
- Handles order creation and lifecycle management
- Implements Saga Orchestration Pattern for data consistency
- Uses State Machine for order status transitions
- Provides synchronous stock validation via REST
- Publishes asynchronous events via RabbitMQ

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- RabbitMQ 3.12+

### Option 1: Docker Compose (Recommended)

```bash
# Start all services (Order Service + PostgreSQL + RabbitMQ)
docker-compose up -d

# View logs
docker-compose logs -f order-service

# Stop services
docker-compose down
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env

# Start PostgreSQL and RabbitMQ locally, then:
npm run dev
```

## 📡 API Endpoints

| Method | Endpoint | Description | Headers |
|--------|----------|-------------|---------|
| `POST` | `/api/orders` | Create new order | `Idempotency-Key: uuid` |
| `GET` | `/api/orders/:orderId` | Get order by ID | - |
| `GET` | `/api/orders/user/:userId` | Get user's orders | - |
| `PATCH` | `/api/orders/:orderId/status` | Update order status | - |
| `DELETE` | `/api/orders/:orderId` | Cancel order | - |
| `GET` | `/health` | Health check | - |

## 📝 API Examples

### Create Order

```bash
curl -X POST http://localhost:3004/api/orders \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "userId": 1,
    "items": [
      { "productId": 101, "quantity": 2, "unitPrice": 99.99 }
    ],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Istanbul",
      "zipCode": "34000",
      "country": "Turkey"
    },
    "paymentDetails": {
      "method": "credit_card",
      "cardLastFour": "1234"
    }
  }'
```

### Get Order

```bash
curl http://localhost:3004/api/orders/{orderId}
```

### Get User Orders

```bash
curl "http://localhost:3004/api/orders/user/1?page=1&limit=10"
```

## 🔄 Order Status Flow (State Machine)

```
PENDING → STOCK_RESERVED → PAYMENT_PENDING → PAID → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
    ↓           ↓               ↓              ↓
  FAILED ←── FAILED ←──────── FAILED ←────── FAILED
    ↓
 REVERSED (after compensation)
```

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3004 | Server port |
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_NAME` | order_db | Database name |
| `DB_USER` | postgres | Database user |
| `DB_PASSWORD` | postgres | Database password |
| `RABBITMQ_URL` | amqp://guest:guest@localhost:5672 | RabbitMQ connection URL |
| `INVENTORY_SERVICE_URL` | http://localhost:3003 | Inventory Service URL |
| `SKIP_AUTH` | false | Skip JWT authentication (dev only) |
| `INVENTORY_SERVICE_MOCK` | false | Mock inventory responses |

## 🏗️ Architecture

```
order-service/
├── src/
│   ├── config/          # Database and logger configuration
│   ├── controllers/     # REST API handlers
│   ├── middleware/      # Auth, validation, idempotency
│   ├── models/          # Sequelize models
│   ├── routes/          # Express routes
│   ├── saga/            # State Machine & Orchestrator
│   ├── services/        # External service clients
│   ├── messaging/       # RabbitMQ pub/sub
│   ├── utils/           # Error classes
│   ├── app.js           # Express app setup
│   └── server.js        # Entry point
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## 🔐 Authentication

Endpoints are protected with JWT. For development, set `SKIP_AUTH=true` in `.env`.

## 🔐 Idempotency

All `POST /api/orders` requests require an `Idempotency-Key` header (UUID format).

## 📩 RabbitMQ Events

### Published Events
- `order.created` - When order is created
- `order.confirmed` - When order is confirmed
- `order.failed` - When order fails

### Consumed Events
- `stock.reserved` - Stock successfully reserved
- `stock.reservation.failed` - Stock reservation failed
- `payment.success` - Payment completed
- `payment.failed` - Payment failed

## 🤝 Integration with Other Services

| Service | Port | Communication |
|---------|------|---------------|
| User Service | 3000 | - |
| Product Service | 8001 | - |
| Basket Service | 3002 | RabbitMQ |
| Inventory Service | 3003 | REST (sync) + RabbitMQ (async) |
| API Gateway | 8000 | REST |

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests (requires Docker)
npm run test:integration
```

## 📄 License

MIT

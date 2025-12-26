# User Service API

Microservice for user authentication and management in the eCommerce platform.

## Endpoints

### Authentication

- **POST /api/user/register** - Register a new user account with email and password
- **POST /api/user/login** - Authenticate user with email and password, returns user info

### User Management

- **GET /api/user/:userId** - Retrieve user profile information by user ID
- **GET /api/user/gift/:userId** - Get user's gift point balance
- **POST /api/user/gift/add** - Add gift points to a user account

## Tech Stack

- Node.js + Express
- PostgreSQL database
- bcrypt for password hashing
- Swagger for API documentation

## Documentation

Swagger UI available at: `http://localhost:3000/api-docs`

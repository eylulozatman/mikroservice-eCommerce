# User Service API

Microservice for user authentication and management in the eCommerce platform.

## Endpoints

### Authentication

**POST /register**
- **Description:** Register a new user.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "Name",
    "surname": "Surname",
    "gender": "female" 
  }
  ```
  *(Note: `admin@gmail.com` or `test@gmail.com` automatically get `isAdmin: true`)*
- **Response:**
  ```json
  {
    "user_id": 1,
    "email": "user@example.com",
    "name": "Name",
    "surname": "Surname",
    "isAdmin": false
  }
  ```

**POST /login**
- **Description:** Authenticate user.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Login successful",
    "user": {
      "user_id": 1,
      "email": "user@example.com",
      "name": "Name",
      "surname": "Surname",
      "isAdmin": false
    }
  }
  ```

### User Data

**GET /{userId}**
- **Description:** Retrieve user profile information.
- **Response:**
  ```json
  {
    "user_id": 1,
    "email": "user@example.com",
    "name": "Name",
    "surname": "Surname",
    "gender": "female",
    "isAdmin": false
  }
  ```

### Gift Points

**GET /gift/{userId}**
- **Description:** Get user's current gift point balance.
- **Response:**
  ```json
  {
    "user_id": 1,
    "point": 0
  }
  ```

**POST /gift/add**
- **Description:** Add gift points to a user account.
- **Request Body:**
  ```json
  {
    "userId": 1,
    "point": 10
  }
  ```
- **Response:**
  ```json
  {
    "user_id": 1,
    "point": 10
  }
  ```

## Tech Stack

- Node.js + Express
- PostgreSQL database
- bcrypt for password hashing
- Swagger for API documentation

## Documentation

Swagger UI available at: `http://localhost:3000/api-docs`

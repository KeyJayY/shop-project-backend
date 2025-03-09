# Online Store Backend

This is a Node.js application developed as a final project for a university course on databases. The backend provides the necessary API endpoints to support an online store, handling user authentication, product management, orders, and other essential e-commerce functionalities. The application utilizes Express.js for the backend framework and PostgreSQL as the database.

## Features
- **User Authentication**: Register, log in, and manage user sessions using JWT-based authentication.
- **Product Management**: Add, update, delete, and retrieve products with detailed information.
- **Order Processing**: Create and manage customer orders, including order status updates.
- **Cart System**: Handle shopping cart operations for adding and removing items.
- **Database Integration**: Store and retrieve data efficiently using PostgreSQL.
- **RESTful API**: Structured endpoints for seamless frontend communication.
- **Security Measures**: Hashing passwords using bcrypt and secure data handling.

## Usage
1. Clone the repository.
2. Install dependencies using:
   ```sh
   npm install
   ```
3. Set up environment variables in a `.env` file:
   ```env
   DATABASE_URL=your_database_connection_string
   JWT_SECRET=your_secret_key
   ```
4. Start the server:
   ```sh
   npm start
   ```
5. Access the API via `http://localhost:3000` (default port).

## Installation Notes
The application is designed to run on Node.js and requires a PostgreSQL database. Ensure that your database connection is properly configured before running the server.

## Notes
This project was developed as part of a university course on databases. It provides a functional backend for an online store, focusing on secure and efficient data management.


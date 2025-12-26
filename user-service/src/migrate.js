require("dotenv").config();
const pool = require("./database");


const migrate = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(50),
        surname VARCHAR(50),
        gender VARCHAR(10)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS auth (
        email VARCHAR(100) PRIMARY KEY,
        password TEXT NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_gift_point (
        user_id INTEGER PRIMARY KEY REFERENCES users(user_id),
        point INTEGER DEFAULT 0
      );
    `);

    console.log("User-service tables created.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    process.exit();
  }
};

migrate();

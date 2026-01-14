require("dotenv").config();
const pool = require("./database");


const migrate = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(100),
        is_admin BOOLEAN DEFAULT FALSE
      );
    `);

    // Add is_admin column if it doesn't exist (for existing databases)
    try {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
      `);
    } catch (e) {
      console.log("Column is_admin might already exist or error adding it:", e.message);
    }

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
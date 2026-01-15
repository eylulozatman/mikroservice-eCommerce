require("dotenv").config();
const pool = require("./database");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const migrate = async (retries = 10, delay = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Migration attempt ${attempt}/${retries}...`);

      await pool.query('SELECT 1');

      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          user_id SERIAL PRIMARY KEY,
          email VARCHAR(100) UNIQUE NOT NULL,
          name VARCHAR(100),
          is_admin BOOLEAN DEFAULT FALSE
        );
      `);

      try {
        await pool.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
        `);
      } catch (e) {
        console.log("Column is_admin might already exist:", e.message);
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

      console.log("User-service tables created successfully.");
      process.exit(0);
    } catch (err) {
      console.error(`Attempt ${attempt} failed:`, err.message);
      if (attempt < retries) {
        console.log(`Retrying in ${delay / 1000}s...`);
        await sleep(delay);
      } else {
        console.error("All migration attempts failed!");
        process.exit(1);
      }
    }
  }
};

migrate();
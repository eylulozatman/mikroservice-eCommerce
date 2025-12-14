require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

pool.on("connect", () => {
  console.log(
    `PostgreSQL connected → ${process.env.DB_HOST}/${process.env.DB_NAME}`
  );
});

module.exports = pool;

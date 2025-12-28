const pool = require("../database");

module.exports = {
  /**
   * Create a new user with email
   */
  createUser: async (user) => {
    const result = await pool.query(
      `INSERT INTO users (email, name, is_admin)
       VALUES ($1, $2, $3)
       RETURNING user_id, email, name, is_admin`,
      [user.email, user.name, user.isAdmin]
    );
    return result.rows[0];
  },

  /**
   * Get user by email
   */
  getByEmail: async (email) => {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    return result.rows[0];
  },

  /**
   * Get user by user_id
   */
  getById: async (userId) => {
    const result = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [userId]
    );
    return result.rows[0];
  }
};

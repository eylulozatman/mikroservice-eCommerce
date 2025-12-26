const pool = require("../database");

module.exports = {
  /**
   * Create auth credentials with email
   */
  createAuth: async (auth) => {
    await pool.query(
      `INSERT INTO auth (email, password)
       VALUES ($1, $2)`,
      [auth.email, auth.password]
    );
  },

  /**
   * Get auth credentials by email
   */
  getAuth: async (email) => {
    const result = await pool.query(
      "SELECT * FROM auth WHERE email = $1",
      [email]
    );
    return result.rows[0];
  }
};

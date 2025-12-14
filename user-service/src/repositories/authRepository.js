const pool = require("../database");

module.exports = {
  createAuth: async (auth) => {
    await pool.query(
      `INSERT INTO auth (username, password)
       VALUES ($1, $2)`,
      [auth.username, auth.password]
    );
  },

  getAuth: async (username) => {
    const result = await pool.query(
      "SELECT * FROM auth WHERE username = $1",
      [username]
    );
    return result.rows[0];
  }
};

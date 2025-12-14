const pool = require("../database");

module.exports = {
  createUser: async (user) => {
    await pool.query(
      `INSERT INTO users (username, name, surname, gender)
       VALUES ($1, $2, $3, $4)`,
      [user.username, user.name, user.surname, user.gender]
    );
  },

  getByUsername: async (username) => {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    return result.rows[0];
  }
};

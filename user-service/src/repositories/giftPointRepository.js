const pool = require("../database");

module.exports = {
  initPoint: async (userId) => {
    await pool.query(
      `INSERT INTO user_gift_point (user_id, point)
       VALUES ($1, 0)`,
      [userId]
    );
  },

  addPoint: async (userId, point) => {
    await pool.query(
      `UPDATE user_gift_point
       SET point = point + $1
       WHERE user_id = $2`,
      [point, userId]
    );
  },

  getPoint: async (userId) => {
    const result = await pool.query(
      "SELECT point FROM user_gift_point WHERE user_id = $1",
      [userId]
    );
    return result.rows[0];
  }
};

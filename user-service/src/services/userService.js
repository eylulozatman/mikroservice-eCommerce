const pool = require("../database");
const bcrypt = require("bcrypt");

exports.register = async ({ username, password, name, surname, gender }) => {
  // users tablosu
  const userResult = await pool.query(
    `INSERT INTO users (username, name, surname, gender)
     VALUES ($1, $2, $3, $4)
     RETURNING user_id, username`,
    [username, name, surname, gender]
  );

  // auth tablosu
  const hashedPassword = await bcrypt.hash(password, 10);

  await pool.query(
    `INSERT INTO auth (username, password)
     VALUES ($1, $2)`,
    [username, hashedPassword]
  );

  // gift point tablosu
  await pool.query(
    `INSERT INTO user_gift_point (user_id, point)
     VALUES ($1, 0)`,
    [userResult.rows[0].user_id]
  );

  return userResult.rows[0];
};

exports.login = async ({ username, password }) => {
  const result = await pool.query(
    `SELECT password FROM auth WHERE username = $1`,
    [username]
  );

  if (result.rowCount === 0) {
    throw new Error("User not found");
  }

  const isMatch = await bcrypt.compare(password, result.rows[0].password);
  if (!isMatch) {
    throw new Error("Wrong password");
  }

  return { message: "Login successful", username };
};

exports.getUserInfo = async (userId) => {
  const result = await pool.query(
    `SELECT user_id, username, name, surname, gender
     FROM users
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0];
};

exports.getPoint = async (userId) => {
  const result = await pool.query(
    `SELECT point FROM user_gift_point WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0];
};

exports.addPoint = async ({ userId, point }) => {
  const result = await pool.query(
    `UPDATE user_gift_point
     SET point = point + $1
     WHERE user_id = $2
     RETURNING point`,
    [point, userId]
  );

  return result.rows[0];
};

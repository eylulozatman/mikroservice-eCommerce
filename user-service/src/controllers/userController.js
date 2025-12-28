const userService = require("../services/userService");

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User management endpoints
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 example: eylul@example.com
 *               password:
 *                 type: string
 *                 example: 123456
 *               name:
 *                 type: string
 *                 example: Eylül
 *     responses:
 *       201:
 *         description: User created
 */
exports.register = async (req, res) => {
  try {
    const user = await userService.register(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: eylul@example.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Wrong credentials
 */
exports.login = async (req, res) => {
  try {
    const result = await userService.login(req.body);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

/**
 * @swagger
 * /{userId}:
 *   get:
 *     summary: Get user info by userId
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: User info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: integer
 *                   example: 1
 *                 email:
 *                   type: string
 *                   example: eylul@example.com
 *                 name:
 *                   type: string
 *                   example: Eylül
 *                 isAdmin:
 *                   type: boolean
 *                   example: false
 *       400:
 *         description: User not found or invalid request
 */
exports.getUserInfo = async (req, res) => {
  try {
    const user = await userService.getUserInfo(req.params.userId);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


/**
 * @swagger
 * /gift/{userId}:
 *   get:
 *     summary: Get user gift point
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Gift point
 */
exports.getPoint = async (req, res) => {
  try {
    const point = await userService.getPoint(req.params.userId);
    res.json(point);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * @swagger
 * /gift/add:
 *   post:
 *     summary: Add gift point to user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - point
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               point:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Updated point
 */
exports.addPoint = async (req, res) => {
  try {
    const result = await userService.addPoint(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

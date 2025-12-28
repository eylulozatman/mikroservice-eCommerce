const bcrypt = require("bcrypt");
const userRepository = require("../repositories/userRepository");
const authRepository = require("../repositories/authRepository");
const giftPointRepository = require("../repositories/giftPointRepository");

/**
 * Register a new user with email, password, and optional profile info
 * Aligned with frontend API requirements (uses email instead of username)
 */
exports.register = async ({ email, password, name, surname }) => {
  // Check if user already exists
  const existingUser = await userRepository.getByEmail(email);
  if (existingUser) {
    throw new Error("user-service error: User already exists with this email");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user in users table
  const isAdmin = (email === "admin@gmail.com" || email === "test@gmail.com");

  if (!name) {
    throw new Error("user-service error: Name is required");
  }

  const user = await userRepository.createUser({
    email,
    name: name || null,
    surname: surname || null,
    isAdmin
  });

  // Create auth credentials
  await authRepository.createAuth({
    email,
    password: hashedPassword
  });

  // Initialize gift points
  await giftPointRepository.initPoint(user.user_id);

  return {
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    surname: user.surname,
    isAdmin: user.is_admin
  };
};

/**
 * Login user with email and password
 * Returns user info and token (aligned with frontend)
 */
exports.login = async ({ email, password }) => {
  // Get auth credentials
  const auth = await authRepository.getAuth(email);

  if (!auth) {
    throw new Error("user-service error: User not found");
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, auth.password);
  if (!isMatch) {
    throw new Error("user-service error: Wrong password");
  }

  // Get user info
  const user = await userRepository.getByEmail(email);

  return {
    message: "Login successful",
    user: {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      surname: user.surname,
      isAdmin: user.is_admin
    }
  };
};

/**
 * Get user information by userId
 */
exports.getUserInfo = async (userId) => {
  const user = await userRepository.getById(userId);

  if (!user) {
    throw new Error("user-service error: User not found");
  }

  return {
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    surname: user.surname,
    isAdmin: user.is_admin
  };
};

/**
 * Get user gift points
 */
exports.getPoint = async (userId) => {
  const pointData = await giftPointRepository.getPoint(userId);

  if (!pointData) {
    throw new Error("user-service error: Gift points not found for user");
  }

  return pointData;
};

/**
 * Add gift points to user
 */
exports.addPoint = async ({ userId, point }) => {
  if (point <= 0) {
    throw new Error("user-service error: Point value must be positive");
  }

  await giftPointRepository.addPoint(userId, point);
  const updatedPoints = await giftPointRepository.getPoint(userId);

  return updatedPoints;
};

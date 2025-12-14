require("dotenv").config();
const express = require("express");
const userController = require("./controllers/userController");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
app.use(express.json());

// Router
const router = express.Router();

router.post("/register", userController.register);
router.post("/login", userController.login);

router.get("/:userId", userController.getUserInfo);
router.get("/gift/:userId", userController.getPoint);
router.post("/gift/add", userController.addPoint);

// Test endpoint (JSON gönderim test etmek için)
router.post("/test", (req, res) => {
  console.log("Received body:", req.body);
  res.json({ received: req.body });
});

app.use("/api/user", router);

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User Service API",
      version: "1.0.0",
      description: "User management service endpoints",
    },
  },
  apis: ["./src/controllers/*.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`User-service running on port ${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});

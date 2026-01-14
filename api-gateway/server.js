require("dotenv").config();
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const app = express();

app.use(cors({
  origin: "http://localhost:5173", // Frontend'in adresi
  methods: ["GET", "POST", "DELETE", "PUT"],
  credentials: true
}));
const PORT = process.env.PORT || 8000;

// 1. User Service (Port 3000)
// İstek: http://localhost:8000/api/user/login
// Hedef: http://user-service:3000/login (user-service "/" prefix ile çalışıyor)
app.use("/api/user",
  createProxyMiddleware({
    target: "http://user-service:3000",
    changeOrigin: true,
    pathRewrite: { '^/api/user': '' },
    on: {
      proxyReq: (proxyReq, req) => {
        console.log(`[PROXY] ${req.method} ${req.url} -> ${proxyReq.path}`);
      }
    }
  })
);

// 2. Product Service (Port 3001)
// İstek: http://localhost:8000/api/products/addProduct
// Hedef: http://localhost:3001/addProduct
app.use(
  "/api/products",
  createProxyMiddleware({
    target: "http://product-service:3001",
    changeOrigin: true,
  })
);

// 3. Basket (Sepet) Service (Port 3002)
app.use(
  "/api/basket",
  createProxyMiddleware({
    target: "http://basket-service:3002",
    changeOrigin: true,
  })
);

// 4. Inventory Service (Port 3003)
app.use(
  "/api/inventory",
  createProxyMiddleware({
    target: "http://inventory-service:3003",
    changeOrigin: true,
  })
);

// 5. Order Service (Port 3004)
app.use(
  "/api/orders",
  createProxyMiddleware({
    target: "http://order-service:3004",
    changeOrigin: true,
    pathRewrite: {
      '^/api/orders': '',
    },
  })
  
);

//Health Check endpoint'i
app.get("/", (req, res) => {
  res.send("API Gateway is running...");
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

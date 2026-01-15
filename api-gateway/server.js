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
// İstek: http://localhost:8000/api/products
// Hedef: http://product-service:3001/products
// Not: Express middleware /api/products prefix'ini kesiyor, req.url "/" olarak gelir
app.use(
  "/api/products",
  createProxyMiddleware({
    target: "http://product-service:3001",
    changeOrigin: true,
    pathRewrite: (path, req) => {

      const newPath = path === '/' ? '/products' : '/products' + path;
      console.log(`[PROXY] ${req.method} /api/products${path} -> ${newPath}`);
      return newPath;
    }
  })
);

// 3. Basket (Sepet) Service (Port 3002)
// İstek: http://localhost:8000/api/basket/{userId}
// Hedef: http://basket-service:3002/basket/{userId}
app.use(
  "/api/basket",
  createProxyMiddleware({
    target: "http://basket-service:3002",
    changeOrigin: true,
    pathRewrite: (path, req) => {
      // Express middleware path'i kesiyor
      // "/" gelirse "/basket", "/{userId}" gelirse "/basket/{userId}" olarak yönlendir
      const newPath = path === '/' ? '/basket' : '/basket' + path;
      console.log(`[PROXY] ${req.method} /api/basket${path} -> ${newPath}`);
      return newPath;
    }
  })
);

// 4. Inventory Service (Port 3003)
// İstek: http://localhost:8000/api/inventory/check
// Hedef: http://inventory-service:3003/inventory/check
app.use(
  "/api/inventory",
  createProxyMiddleware({
    target: "http://inventory-service:3003",
    changeOrigin: true,
    pathRewrite: (path, req) => {
      // Express middleware path'i kesiyor
      // "/" gelirse "/inventory", "/check" gelirse "/inventory/check" olarak yönlendir
      const newPath = path === '/' ? '/inventory' : '/inventory' + path;
      console.log(`[PROXY] ${req.method} /api/inventory${path} -> ${newPath}`);
      return newPath;
    }
  })
);

// 5. Order Service (Port 3004)
// İstek: http://localhost:8000/api/orders -> http://order-service:3004/
app.use(
  "/api/orders",
  createProxyMiddleware({
    target: "http://order-service:3004",
    changeOrigin: true,
    pathRewrite: (path, req) => {
      // /api/orders -> /
      // /api/orders/user/2 -> /user/2
      const newPath = path === '/' ? '/' : path;
      console.log(`[PROXY] ${req.method} /api/orders${path} -> ${newPath}`);
      return newPath;
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

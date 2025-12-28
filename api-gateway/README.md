# MicroStore API Gateway

API Gateway, tüm istemci isteklerini karşılayan ve ilgili mikroservislere (User, Product, Order vb.) yönlendiren merkezi kapıdır.

## Başlatma
### 1. Seçenek: Docker ile (Önerilen)
Ana dizinde şu komutu çalıştırmanız yeterlidir:
```bash
docker compose up --build -d api-gateway

### 2. Seçenek: Manuel Başlatma (Local)
npm install
npm start

Uygulama http://localhost:8000 adresinde çalışacaktır.


Servis Yönlendirmeleri (Proxy Map)
Tüm frontend istekleri port 8000 üzerinden karşılanır ve ilgili servislere dağıtılır:

User Service: /api/user -> http://localhost:3000

Product Service: /api/products -> http://localhost:3001

Basket Service: /api/basket -> http://localhost:3002

Inventory Service: /api/inventory -> http://localhost:3003

Order Service: /api/orders -> http://localhost:3004

Frontend (Port 5173) ile iletişim için CORS desteği eklenmiştir.

Gateway, istekleri iletirken servislerin ayakta olduğunu varsayar.

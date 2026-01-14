package com.ecommerce.basket_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

// Order Service ile konuşur (buyProduct ilişkisi)
@FeignClient(name = "order-service", url = "http://localhost:8081")
public interface OrderClient {

    // Sepeti siparişe dönüştürmek için tetikleyici
    @PostMapping("/api/orders")
    void createOrder(@RequestBody Object orderRequest);
}
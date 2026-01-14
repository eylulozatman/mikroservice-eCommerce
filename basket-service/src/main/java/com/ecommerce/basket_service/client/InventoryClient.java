package com.ecommerce.basket_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

// Inventory Service ile konuşur
@FeignClient(name = "inventory-service", url = "${inventory.service.url:http://inventory-service:3003}")
public interface InventoryClient {

    // Stok bilgisi: {"productId": 1, "stock": 100}
    @GetMapping("/inventory/{productId}")
    Map<String, Object> getStock(@PathVariable Long productId);
}
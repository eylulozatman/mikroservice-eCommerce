package com.ecommerce.basket_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

// Inventory Service ile konuşur
@FeignClient(name = "inventory-service", url = "http://localhost:8084")
public interface InventoryClient {

    // Stok kontrolü: True/False veya adet döner
    @GetMapping("/inventory/{productId}")
    Boolean checkStock(@PathVariable String productId);
}
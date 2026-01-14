package com.example.inventoryservice.controller;

import com.example.inventoryservice.dto.*;
import com.example.inventoryservice.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    /**
     * Ürünün stok bilgisini getirir
     * GET /inventory/{productId}
     */
    @GetMapping("/inventory/{productId}")
    public ResponseEntity<InventoryResponse> getStock(@PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.getStock(productId));
    }

    /**
     * Stok kontrolü yapar - sepete eklerken kullanılır
     * POST /inventory/check
     */
    @PostMapping("/inventory/check")
    public ResponseEntity<CheckResponse> checkStock(@RequestBody CheckRequest request) {
        CheckResponse response = inventoryService.checkStock(
                request.productId(),
                request.quantity());
        return ResponseEntity.ok(response);
    }

    /**
     * Stok düşürür - sipariş tamamlandığında kullanılır
     * POST /inventory/decrease
     */
    @PostMapping("/inventory/decrease")
    public ResponseEntity<InventoryResponse> decreaseStock(@Valid @RequestBody DecreaseRequest request) {
        InventoryResponse response = inventoryService.decreaseStock(
                request.productId(),
                request.quantity());
        return ResponseEntity.ok(response);
    }
}

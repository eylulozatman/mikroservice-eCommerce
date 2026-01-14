package com.example.inventoryservice.dto;

public record CheckRequest(Long productId, Integer quantity) {
    public CheckRequest {
        if (quantity == null || quantity < 1) {
            quantity = 1;
        }
    }
}

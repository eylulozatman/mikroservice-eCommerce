package com.example.inventoryservice.dto;

public record CheckResponse(
        Long productId,
        boolean available,
        Integer currentStock,
        Integer requestedQuantity) {
}

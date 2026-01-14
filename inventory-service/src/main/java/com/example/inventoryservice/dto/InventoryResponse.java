package com.example.inventoryservice.dto;

public record InventoryResponse(
        Long productId,
        Integer stock) {
}

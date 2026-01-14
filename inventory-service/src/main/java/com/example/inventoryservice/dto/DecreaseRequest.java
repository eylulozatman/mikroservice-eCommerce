package com.example.inventoryservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record DecreaseRequest(
        @NotNull Long productId,
        @NotNull @Min(1) Integer quantity) {
}

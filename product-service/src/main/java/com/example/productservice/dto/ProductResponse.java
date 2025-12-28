package com.example.productservice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ProductResponse(
    UUID id,
    String name,
    String description,
    BigDecimal price,
    String currency,
    String category,
    Boolean isActive,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}

package com.example.productservice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductResponse(
    Long id,
    String name,
    String description,
    BigDecimal price,
    String currency,
    String category,
    String imageUrl,
    Boolean isActive,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}

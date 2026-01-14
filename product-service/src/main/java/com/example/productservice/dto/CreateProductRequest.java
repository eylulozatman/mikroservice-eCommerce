package com.example.productservice.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record CreateProductRequest(
    @NotBlank @Size(max = 200) String name,
    @Size(max = 5000) String description,
    @NotNull @DecimalMin(value = "0.0", inclusive = true) BigDecimal price,
    @Pattern(regexp = "^[A-Z]{3}$", message = "currency must be 3-letter uppercase like TRY/USD/EUR")
    String currency,
    @Size(max = 120) String category,
    @Size(max = 2048) String imageUrl
) {}

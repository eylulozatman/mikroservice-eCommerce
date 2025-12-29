package com.ecommerce.basket_service.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class BasketItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String productId;
    private String productName; // UI gösterimi için
    private Double price;
    private Integer quantity;
}
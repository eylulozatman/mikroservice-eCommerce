package com.ecommerce.basket_service.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Data
public class Basket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Frontend API Gateway üzerinden userId gönderiyor
    private String userId;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "basket_id")
    private List<BasketItem> items;

    // Sepet toplam tutarını hesaplayan yardımcı metot
    public Double getTotalPrice() {
        if (items == null) return 0.0;
        return items.stream().mapToDouble(i -> i.getPrice() * i.getQuantity()).sum();
    }
}
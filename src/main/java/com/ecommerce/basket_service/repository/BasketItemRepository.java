package com.ecommerce.basket_service.repository;

import com.ecommerce.basket_service.model.BasketItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BasketItemRepository extends JpaRepository<BasketItem, Long> {
    // Şimdilik ekstra bir sorguya ihtiyacımız yok, standart CRUD işlemleri yeterli.
}
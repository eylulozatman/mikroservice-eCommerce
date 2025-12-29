package com.ecommerce.basket_service.repository;

import com.ecommerce.basket_service.model.Basket;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BasketRepository extends JpaRepository<Basket, Long> {

    // Kullanıcının ID'sine göre sepetini bulmamızı sağlar.
    // "Select * from Basket where userId = ?" sorgusunu otomatik oluşturur.
    Optional<Basket> findByUserId(String userId);
}
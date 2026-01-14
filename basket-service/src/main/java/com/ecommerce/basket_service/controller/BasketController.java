package com.ecommerce.basket_service.controller;

import com.ecommerce.basket_service.model.Basket;
import com.ecommerce.basket_service.model.BasketItem;
import com.ecommerce.basket_service.service.BasketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/basket")
@RequiredArgsConstructor
public class BasketController {

    private final BasketService basketService;

    // GET /basket/{userId} - Kullanıcının güncel sepetini getirir
    @GetMapping("/{userId}")
    public ResponseEntity<Basket> getBasket(@PathVariable Long userId) {
        return ResponseEntity.ok(basketService.getBasketByUserId(userId));
    }

    // POST /basket/{userId}/add - Sepete ürün ekler
    @PostMapping("/{userId}/add")
    public ResponseEntity<Map<String, Object>> addToBasket(@PathVariable Long userId, @RequestBody BasketItem item) {
        basketService.addItemToBasket(userId, item);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Ürün sepete eklendi."));
    }

    // DELETE /basket/{userId}/item/{itemId} - Sepetten ürün çıkarır
    @DeleteMapping("/{userId}/item/{itemId}")
    public ResponseEntity<Map<String, Object>> removeItem(@PathVariable Long userId, @PathVariable Long itemId) {
        basketService.removeItem(userId, itemId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Ürün sepetten silindi."));
    }

    // DELETE /basket/{userId}/clear - Sepeti boşaltır
    @DeleteMapping("/{userId}/clear")
    public ResponseEntity<Map<String, Object>> clearBasket(@PathVariable Long userId) {
        basketService.clearBasket(userId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Sepet temizlendi."));
    }
}
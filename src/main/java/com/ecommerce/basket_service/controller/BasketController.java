package com.ecommerce.basket_service.controller;

import com.ecommerce.basket_service.model.Basket;
import com.ecommerce.basket_service.model.BasketItem;
import com.ecommerce.basket_service.service.BasketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/basket")
@RequiredArgsConstructor
public class BasketController {

    private final BasketService basketService;

    // GET /api/basket/{userId} - Kullanıcının güncel sepetini getirir
    @GetMapping("/{userId}")
    public ResponseEntity<Basket> getBasket(@PathVariable String userId) {
        return ResponseEntity.ok(basketService.getBasketByUserId(userId));
    }

    // POST /api/basket/add - Sepete ürün ekler
    // frontendden userId
    @PostMapping("/{userId}/add")
    public ResponseEntity<String> addToBasket(@PathVariable String userId, @RequestBody BasketItem item) {
        basketService.addItemToBasket(userId, item);
        return ResponseEntity.ok("Ürün sepete eklendi.");
    }

    // DELETE /api/basket/item/{itemId} - Sepetten ürün çıkarır
    @DeleteMapping("/{userId}/item/{itemId}")
    public ResponseEntity<String> removeItem(@PathVariable String userId, @PathVariable Long itemId) {
        basketService.removeItem(userId, itemId);
        return ResponseEntity.ok("Ürün sepetten silindi.");
    }

    // DELETE /api/basket/clear - Sepeti boşaltır
    @DeleteMapping("/{userId}/clear")
    public ResponseEntity<String> clearBasket(@PathVariable String userId) {
        basketService.clearBasket(userId);
        return ResponseEntity.ok("Sepet temizlendi.");
    }
}
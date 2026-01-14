package com.ecommerce.basket_service.service;

import com.ecommerce.basket_service.client.InventoryClient;
import com.ecommerce.basket_service.model.Basket;
import com.ecommerce.basket_service.model.BasketItem;
import com.ecommerce.basket_service.repository.BasketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BasketService {

    private final BasketRepository basketRepository;
    private final InventoryClient inventoryClient;

    @Transactional
    public Basket getBasketByUserId(Long userId) {
        return basketRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Basket newBasket = new Basket();
                    newBasket.setUserId(userId);
                    newBasket.setItems(new ArrayList<>());
                    return basketRepository.save(newBasket);
                });
    }

    @Transactional
    public void addItemToBasket(Long userId, BasketItem item) {
        // Stok kontrolü (opsiyonel - inventory-service erişilebilir değilse atla)
        try {
            Map<String, Object> stockInfo = inventoryClient.getStock(item.getProductId());
            Integer stock = (Integer) stockInfo.get("stock");
            if (stock != null && stock < item.getQuantity()) {
                throw new RuntimeException("Yetersiz stok! Mevcut: " + stock + ", İstenen: " + item.getQuantity());
            }
        } catch (Exception e) {
            // Inventory service erişilemezse loglayıp devam et
            System.out.println("Inventory check skipped: " + e.getMessage());
        }

        // Sepeti getir veya oluştur
        Basket basket = getBasketByUserId(userId);

        // Aynı ürün varsa miktarı artır
        basket.getItems().stream()
                .filter(i -> i.getProductId().equals(item.getProductId()))
                .findFirst()
                .ifPresentOrElse(
                        existing -> existing.setQuantity(existing.getQuantity() + item.getQuantity()),
                        () -> basket.getItems().add(item));

        basketRepository.save(basket);
    }

    @Transactional
    public void removeItem(Long userId, Long itemId) {
        Basket basket = getBasketByUserId(userId);
        basket.getItems().removeIf(item -> item.getId().equals(itemId));
        basketRepository.save(basket);
    }

    @Transactional
    public void clearBasket(Long userId) {
        Basket basket = getBasketByUserId(userId);
        basket.getItems().clear();
        basketRepository.save(basket);
    }

    // ASYNC: RabbitMQ Dinleyicisi - Sipariş oluştuğunda sepeti temizler
    @RabbitListener(queues = "order-created-queue")
    public void handleOrderCreatedEvent(String userIdStr) {
        try {
            Long userId = Long.parseLong(userIdStr);
            System.out.println("Sipariş oluşturuldu eventi alındı, sepet temizleniyor: " + userId);
            clearBasket(userId);
        } catch (NumberFormatException e) {
            System.err.println("Invalid userId in order event: " + userIdStr);
        }
    }
}
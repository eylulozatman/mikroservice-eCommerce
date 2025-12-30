package com.ecommerce.basket_service.service;

import com.ecommerce.basket_service.client.InventoryClient;
import com.ecommerce.basket_service.model.Basket;
import com.ecommerce.basket_service.model.BasketItem;
import com.ecommerce.basket_service.repository.BasketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BasketService {

    private final BasketRepository basketRepository;
    private final InventoryClient inventoryClient;

    public Basket getBasketByUserId(String userId) {
        return basketRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Basket newBasket = new Basket();
                    newBasket.setUserId(userId);
                    newBasket.setItems(new ArrayList<>());
                    return basketRepository.save(newBasket);
                });
    }

    public void addItemToBasket(String userId, BasketItem item) {
        // 1. Önce Inventory Service'e sor: Stok var mı?
        /*
        Boolean inStock = inventoryClient.checkStock(item.getProductId());

        if (!inStock) {
            throw new RuntimeException("Ürün stokta yok!");
        }
        geçici olarak kapalı (ınventory servisi dolayısıyla)*/
        // 2. Sepeti getir veya oluştur
        Basket basket = getBasketByUserId(userId);

        // 3. Ürünü ekle
        basket.getItems().add(item);
        basketRepository.save(basket);
    }

    public void removeItem(String userId, Long itemId) {
        Basket basket = getBasketByUserId(userId);
        basket.getItems().removeIf(item -> item.getId().equals(itemId));
        basketRepository.save(basket);
    }

    public void clearBasket(String userId) {
        Basket basket = getBasketByUserId(userId);
        basket.getItems().clear();
        basketRepository.save(basket);
    }

    // ASYNC: RabbitMQ Dinleyicisi
    // Sipariş oluştuğunda (OrderCreatedEvent) sepeti temizler [cite: 69, 70]
    @RabbitListener(queues = "order-created-queue") // Queue ismini Order servisiyle eşleştirin
    public void handleOrderCreatedEvent(String userId) {
        System.out.println("Sipariş oluşturuldu eventi alındı, sepet temizleniyor: " + userId);
        clearBasket(userId);
    }
}
package com.example.inventoryservice.listener;

import com.example.inventoryservice.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderFailedListener {

    private final InventoryService inventoryService;

    /**
     * Sipariş başarısız olduğunda stok geri yüklenir (Saga compensation)
     */
    @RabbitListener(queues = "inventory-order-failed-queue")
    public void handleOrderFailed(Map<String, Object> event) {
        try {
            log.info("Received order.failed event: {}", event);

            @SuppressWarnings("unchecked")
            Map<String, Object> order = (Map<String, Object>) event.get("order");
            if (order == null) {
                log.warn("No order data in event");
                return;
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> items = (List<Map<String, Object>>) order.get("items");
            if (items == null || items.isEmpty()) {
                log.warn("No items in order");
                return;
            }

            // Her ürün için stok geri yükle
            for (Map<String, Object> item : items) {
                Long productId = ((Number) item.get("productId")).longValue();
                Integer quantity = ((Number) item.get("quantity")).intValue();

                try {
                    inventoryService.increaseStock(productId, quantity);
                    log.info("Stock restored for product {}: +{}", productId, quantity);
                } catch (Exception e) {
                    log.error("Failed to restore stock for product {}: {}", productId, e.getMessage());
                }
            }

            log.info("Saga compensation completed for order: {}", order.get("id"));
        } catch (Exception e) {
            log.error("Error processing order.failed event: {}", e.getMessage(), e);
        }
    }
}

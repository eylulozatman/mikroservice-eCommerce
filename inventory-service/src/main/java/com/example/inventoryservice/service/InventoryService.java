package com.example.inventoryservice.service;

import com.example.inventoryservice.dto.*;
import com.example.inventoryservice.entity.Inventory;
import com.example.inventoryservice.exception.InsufficientStockException;
import com.example.inventoryservice.exception.NotFoundException;
import com.example.inventoryservice.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    /**
     * Ürünün stok bilgisini getirir
     */
    @Transactional(readOnly = true)
    public InventoryResponse getStock(Long productId) {
        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new NotFoundException("Inventory not found for product: " + productId));

        return new InventoryResponse(inventory.getProductId(), inventory.getStock());
    }

    /**
     * Stok kontrolü yapar - sepete eklerken kullanılır
     */
    @Transactional(readOnly = true)
    public CheckResponse checkStock(Long productId, Integer quantity) {
        if (quantity == null || quantity < 1) {
            quantity = 1;
        }

        Inventory inventory = inventoryRepository.findByProductId(productId).orElse(null);

        if (inventory == null) {
            return new CheckResponse(productId, false, 0, quantity);
        }

        boolean available = inventory.getStock() >= quantity;
        return new CheckResponse(productId, available, inventory.getStock(), quantity);
    }

    /**
     * Stok düşürür - sipariş tamamlandığında kullanılır
     */
    @Transactional
    public InventoryResponse decreaseStock(Long productId, Integer quantity) {
        int updatedRows = inventoryRepository.decreaseStock(productId, quantity);

        if (updatedRows == 0) {
            // Stok yetersiz veya ürün bulunamadı
            Inventory inventory = inventoryRepository.findByProductId(productId).orElse(null);
            if (inventory == null) {
                throw new NotFoundException("Inventory not found for product: " + productId);
            }
            throw new InsufficientStockException(
                    "Insufficient stock for product " + productId +
                            ". Available: " + inventory.getStock() + ", Requested: " + quantity);
        }

        // Güncel stok bilgisini döndür
        Inventory updated = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new NotFoundException("Inventory not found for product: " + productId));

        return new InventoryResponse(updated.getProductId(), updated.getStock());
    }

    /**
     * Stok artırır - sipariş iptal/fail durumunda kullanılır (Saga compensation)
     */
    @Transactional
    public InventoryResponse increaseStock(Long productId, Integer quantity) {
        int updatedRows = inventoryRepository.increaseStock(productId, quantity);

        if (updatedRows == 0) {
            throw new NotFoundException("Inventory not found for product: " + productId);
        }

        Inventory updated = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new NotFoundException("Inventory not found for product: " + productId));

        return new InventoryResponse(updated.getProductId(), updated.getStock());
    }
}

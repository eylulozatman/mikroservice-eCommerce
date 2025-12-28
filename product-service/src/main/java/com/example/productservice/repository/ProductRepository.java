package com.example.productservice.repository;

import com.example.productservice.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
  Page<Product> findByIsActiveTrue(Pageable pageable);
  Page<Product> findByIsActiveTrueAndCategory(String category, Pageable pageable);
}

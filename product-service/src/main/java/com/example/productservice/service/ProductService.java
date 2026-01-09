package com.example.productservice.service;

import com.example.productservice.dto.*;
import com.example.productservice.entity.Product;
import com.example.productservice.exception.NotFoundException;
import com.example.productservice.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductService {

  private final ProductRepository productRepository;

  @Transactional
  public ProductResponse create(CreateProductRequest req) {
    Product p = Product.builder()
        .name(req.name())
        .description(req.description())
        .price(req.price())
        .currency(req.currency() == null ? "TRY" : req.currency())
        .category(req.category())
        .imageUrl(req.imageUrl())       
        .isActive(true)
        .build();

    return toResponse(productRepository.save(p));
  }

  @Transactional(readOnly = true)
  public ProductResponse getById(Long id) {
    Product p = productRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Product not found: " + id));
    return toResponse(p);
  }

  @Transactional(readOnly = true)
  public PagedResponse<ProductResponse> list(Integer page, Integer size, String category, Boolean onlyActive) {
    int p = page == null ? 0 : Math.max(page, 0);
    int s = size == null ? 10 : Math.min(Math.max(size, 1), 100);
    Pageable pageable = PageRequest.of(p, s, Sort.by(Sort.Direction.DESC, "createdAt"));

    boolean active = (onlyActive == null) ? true : onlyActive;

    Page<Product> result;
    if (active) {
      if (category != null && !category.isBlank()) {
        result = productRepository.findByIsActiveTrueAndCategory(category, pageable);
      } else {
        result = productRepository.findByIsActiveTrue(pageable);
      }
    } else {
      result = productRepository.findAll(pageable);
    }

    return new PagedResponse<>(
        result.getContent().stream().map(this::toResponse).toList(),
        result.getNumber(),
        result.getSize(),
        result.getTotalElements(),
        result.getTotalPages()
    );
  }

  @Transactional
  public ProductResponse update(Long id, UpdateProductRequest req) {
    Product p = productRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Product not found: " + id));

    p.setName(req.name());
    p.setDescription(req.description());
    p.setPrice(req.price());
    p.setCurrency(req.currency() == null ? "TRY" : req.currency());
    p.setCategory(req.category());
    if (req.isActive() != null) p.setIsActive(req.isActive());

    p.setImageUrl(req.imageUrl());

    return toResponse(productRepository.save(p));
  }

  @Transactional
  public void delete(Long id) {
    Product p = productRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Product not found: " + id));
    p.setIsActive(false); // soft delete
    productRepository.save(p);
  }

  private ProductResponse toResponse(Product p) {
    return new ProductResponse(
        p.getId(),
        p.getName(),
        p.getDescription(),
        p.getPrice(),
        p.getCurrency(),
        p.getCategory(),
        p.getImageUrl(),     
        p.getIsActive(),
        p.getCreatedAt(),
        p.getUpdatedAt()
    );
  }
}

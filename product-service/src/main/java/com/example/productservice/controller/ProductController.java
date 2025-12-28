package com.example.productservice.controller;

import com.example.productservice.dto.*;
import com.example.productservice.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ProductController {

  private final ProductService productService;

  @GetMapping("/products")
  public PagedResponse<ProductResponse> list(
      @RequestParam(required = false) String category,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size,
      @RequestParam(required = false) Boolean onlyActive
  ) {
    return productService.list(page, size, category, onlyActive);
  }

  @GetMapping("/products/{id}")
  public ProductResponse getById(@PathVariable UUID id) {
    return productService.getById(id);
  }

  @PostMapping("/product")
  @ResponseStatus(HttpStatus.CREATED)
  public ProductResponse create(@Valid @RequestBody CreateProductRequest req) {
    return productService.create(req);
  }

  @PutMapping("/products/{id}")
  public ProductResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateProductRequest req) {
    return productService.update(id, req);
  }

  @DeleteMapping("/products/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable UUID id) {
    productService.delete(id);
  }
}

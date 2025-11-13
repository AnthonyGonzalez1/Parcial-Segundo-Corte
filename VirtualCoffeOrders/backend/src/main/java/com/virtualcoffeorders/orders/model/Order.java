package com.virtualcoffeorders.orders.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Modelo de Pedido
 * Representa un pedido realizado por un cliente en VirtualCoffee
 */
public class Order {
    
    private Long id;
    
    @NotBlank(message = "El nombre de la bebida no puede estar vacío")
    private String beverageName;
    
    @NotNull(message = "El tamaño es obligatorio")
    @Pattern(regexp = "^(small|medium|large)$", 
             message = "El tamaño debe ser: small, medium o large")
    private String size;
    
    private String status; // PENDING, CONFIRMED, REJECTED
    
    private Double price;
    
    private LocalDateTime createdAt;
    
    private String customerName;
    
    private String rejectionReason; // Razón si fue rechazado
    
    // Constructor vacío para Jackson
    public Order() {
        this.status = "PENDING";
        this.createdAt = LocalDateTime.now();
    }
    
    // Constructor con parámetros
    public Order(String beverageName, String size, String customerName) {
        this();
        this.beverageName = beverageName;
        this.size = size;
        this.customerName = customerName;
    }
    
    // Constructor builder-style para tests
    public static OrderBuilder builder() {
        return new OrderBuilder();
    }
    
    // Builder Pattern
    public static class OrderBuilder {
        private String beverageName;
        private String size;
        private String customerName;
        private Double price;
        private String status;
        
        public OrderBuilder beverageName(String beverageName) {
            this.beverageName = beverageName;
            return this;
        }
        
        public OrderBuilder size(String size) {
            this.size = size;
            return this;
        }
        
        public OrderBuilder customerName(String customerName) {
            this.customerName = customerName;
            return this;
        }
        
        public OrderBuilder price(Double price) {
            this.price = price;
            return this;
        }
        
        public OrderBuilder status(String status) {
            this.status = status;
            return this;
        }
        
        public Order build() {
            Order order = new Order(beverageName, size, customerName);
            if (price != null) order.setPrice(price);
            if (status != null) order.setStatus(status);
            return order;
        }
    }
    
    // Getters y Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getBeverageName() {
        return beverageName;
    }
    
    public void setBeverageName(String beverageName) {
        this.beverageName = beverageName;
    }
    
    public String getSize() {
        return size;
    }
    
    public void setSize(String size) {
        this.size = size;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public Double getPrice() {
        return price;
    }
    
    public void setPrice(Double price) {
        this.price = price;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public String getCustomerName() {
        return customerName;
    }
    
    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }
    
    public String getRejectionReason() {
        return rejectionReason;
    }
    
    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
    
    // Métodos de utilidad
    public boolean isConfirmed() {
        return "CONFIRMED".equals(this.status);
    }
    
    public boolean isRejected() {
        return "REJECTED".equals(this.status);
    }
    
    public boolean isPending() {
        return "PENDING".equals(this.status);
    }
    
    // equals y hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Order order = (Order) o;
        return Objects.equals(id, order.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    
    // toString
    @Override
    public String toString() {
        return "Order{" +
                "id=" + id +
                ", beverageName='" + beverageName + '\'' +
                ", size='" + size + '\'' +
                ", status='" + status + '\'' +
                ", price=" + price +
                ", customerName='" + customerName + '\'' +
                ", createdAt=" + createdAt +
                ", rejectionReason='" + rejectionReason + '\'' +
                '}';
    }
}
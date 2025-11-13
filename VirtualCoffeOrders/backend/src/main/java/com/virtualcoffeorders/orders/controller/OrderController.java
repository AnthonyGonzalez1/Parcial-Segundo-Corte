package com.virtualcoffeorders.orders.controller;

import com.virtualcoffeorders.orders.model.Order;
import com.virtualcoffeorders.orders.service.OrderService;
import com.virtualcoffeorders.orders.service.OrderService.BeverageNotFoundException;
import com.virtualcoffeorders.orders.service.OrderService.OrderStatistics;
import com.virtualcoffeorders.orders.service.BeverageClient.BeverageApiUnavailableException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;


@RestController
@RequestMapping("/orders")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:4200"})
public class OrderController {
    
    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);
    
    private final OrderService orderService;
    
    @Autowired
    public OrderController(OrderService orderService) {
        this.orderService = orderService;
        logger.info("OrderController initialized");
    }
    
    /**
     * GET / - Endpoint raíz
     */
    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String customer) {
        
        logger.info("GET /orders - Status filter: {}, Customer filter: {}", status, customer);
        
        List<Order> orders;
        
        if (status != null && !status.isEmpty()) {
            orders = orderService.getOrdersByStatus(status);
        } else if (customer != null && !customer.isEmpty()) {
            orders = orderService.getOrdersByCustomer(customer);
        } else {
            orders = orderService.getAllOrders();
        }
        
        logger.info("Returning {} orders", orders.size());
        return ResponseEntity.ok(orders);
    }
    
    /**
     * GET /{id} - Obtiene un pedido por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id) {
        logger.info("GET /orders/{} - Fetching order", id);
        
        Optional<Order> orderOpt = orderService.getOrderById(id);
        
        if (orderOpt.isPresent()) {
            logger.info("Order found: {}", id);
            return ResponseEntity.ok(orderOpt.get());
        } else {
            logger.warn("Order not found: {}", id);
            Map<String, String> error = new HashMap<>();
            error.put("error", "ORDER_NOT_FOUND");
            error.put("message", "Pedido con ID " + id + " no encontrado");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }
    
    /**
     * GET /status/{status} - Obtiene pedidos por estado
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Order>> getOrdersByStatus(@PathVariable String status) {
        logger.info("GET /orders/status/{}", status);
        
        List<Order> orders = orderService.getOrdersByStatus(status.toUpperCase());
        logger.info("Found {} orders with status {}", orders.size(), status);
        
        return ResponseEntity.ok(orders);
    }
    
    /**
     * GET /customer/{customerName} - Obtiene pedidos por cliente
     */
    @GetMapping("/customer/{customerName}")
    public ResponseEntity<List<Order>> getOrdersByCustomer(@PathVariable String customerName) {
        logger.info("GET /orders/customer/{}", customerName);
        
        List<Order> orders = orderService.getOrdersByCustomer(customerName);
        logger.info("Found {} orders for customer {}", orders.size(), customerName);
        
        return ResponseEntity.ok(orders);
    }
    
    /**
     * GET /statistics - Obtiene estadísticas de pedidos
     */
    @GetMapping("/statistics")
    public ResponseEntity<OrderStatistics> getStatistics() {
        logger.info("GET /orders/statistics");
        
        OrderStatistics stats = orderService.getStatistics();
        logger.info("Statistics: {}", stats);
        
        return ResponseEntity.ok(stats);
    }
    
    /**
     * POST / - Crea un nuevo pedido
     */
    @PostMapping
    public ResponseEntity<?> createOrder(@Valid @RequestBody OrderRequest request) {
        logger.info("POST /orders - Creating order for beverage: {}", 
                   request.getBeverageName());
        
        try {
            Order order = orderService.createOrder(
                request.getBeverageName(),
                request.getSize(),
                request.getCustomerName()
            );
            
            logger.info("Order created successfully - ID: {}, Status: {}", 
                       order.getId(), order.getStatus());
            
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(order);
                    
        } catch (BeverageNotFoundException e) {
            logger.warn("Order rejected - Beverage not found: {}", e.getMessage());
            
            Map<String, String> error = new HashMap<>();
            error.put("error", "BEVERAGE_NOT_FOUND");
            error.put("message", e.getMessage());
            
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(error);
                    
        } catch (BeverageApiUnavailableException e) {
            logger.error("Beverage API unavailable: {}", e.getMessage());
            
            Map<String, String> error = new HashMap<>();
            error.put("error", "SERVICE_UNAVAILABLE");
            error.put("message", "El servicio de bebidas no está disponible. Intente más tarde.");
            
            return ResponseEntity
                    .status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(error);
                    
        } catch (IllegalArgumentException e) {
            logger.warn("Validation error: {}", e.getMessage());
            
            Map<String, String> error = new HashMap<>();
            error.put("error", "VALIDATION_ERROR");
            error.put("message", e.getMessage());
            
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(error);
                    
        } catch (Exception e) {
            logger.error("Unexpected error creating order", e);
            
            Map<String, String> error = new HashMap<>();
            error.put("error", "INTERNAL_ERROR");
            error.put("message", "Error interno del servidor");
            
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error);
        }
    }
    
    /**
     * GET /health - Health check
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        logger.debug("GET /orders/health");
        
        Map<String, Object> health = new HashMap<>();
        health.put("status", "healthy");
        health.put("service", "Orders API");
        health.put("totalOrders", orderService.getAllOrders().size());
        health.put("confirmedOrders", orderService.countOrdersByStatus("CONFIRMED"));
        health.put("rejectedOrders", orderService.countOrdersByStatus("REJECTED"));
        
        return ResponseEntity.ok(health);
    }
    
    /**
     * DELETE / - Limpia todos los pedidos (solo para testing)
     */
    @DeleteMapping
    public ResponseEntity<Map<String, String>> clearOrders() {
        logger.warn("DELETE /orders - Clearing all orders");
        
        orderService.clearOrders();
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "All orders cleared");
        
        return ResponseEntity
                .status(HttpStatus.NO_CONTENT)
                .body(response);
    }
    
    /**
     * Clase para recibir requests de creación de pedidos
     */
    public static class OrderRequest {
        private String beverageName;
        private String size;
        private String customerName;
        
        // Constructors
        public OrderRequest() {}
        
        public OrderRequest(String beverageName, String size, String customerName) {
            this.beverageName = beverageName;
            this.size = size;
            this.customerName = customerName;
        }
        
        // Getters y Setters
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
        
        public String getCustomerName() {
            return customerName;
        }
        
        public void setCustomerName(String customerName) {
            this.customerName = customerName;
        }
        
        @Override
        public String toString() {
            return "OrderRequest{" +
                    "beverageName='" + beverageName + '\'' +
                    ", size='" + size + '\'' +
                    ", customerName='" + customerName + '\'' +
                    '}';
        }
    }
    
    /**
     * Exception Handler para manejo global de errores
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(Exception e) {
        logger.error("Unhandled exception", e);
        
        Map<String, String> error = new HashMap<>();
        error.put("error", "UNEXPECTED_ERROR");
        error.put("message", "Ha ocurrido un error inesperado");
        
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error);
    }
}
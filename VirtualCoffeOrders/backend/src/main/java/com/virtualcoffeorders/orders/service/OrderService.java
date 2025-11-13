package com.virtualcoffeorders.orders.service;

import com.virtualcoffeorders.orders.model.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Servicio principal para gestionar los pedidos
 */
@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);

    private final BeverageClient beverageClient;
    private final List<Order> orders = new ArrayList<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    @Autowired
    public OrderService(BeverageClient beverageClient) {
        this.beverageClient = beverageClient;
        logger.info("OrderService initialized");
    }

    /**
     * Crea un nuevo pedido validando si la bebida existe
     */
    public Order createOrder(String beverageName, String size, String customerName) {
        logger.info("Creating order - Beverage: {}, Size: {}, Customer: {}", beverageName, size, customerName);
        validateOrderInput(beverageName, size, customerName);

        Order order = new Order(beverageName.trim(), size, customerName);
        order.setId(idGenerator.getAndIncrement());

        // Verificar bebida en la API
        if (!beverageClient.beverageExists(beverageName)) {
            order.setStatus("REJECTED");
            order.setRejectionReason("Bebida no disponible en el menú");
            orders.add(order);
            throw new BeverageNotFoundException("La bebida '" + beverageName + "' no está disponible en el menú");
        }

        // Obtener precio desde la API de bebidas
        beverageClient.getBeverage(beverageName).ifPresent(beverage -> {
            order.setPrice(beverage.getPrice());
            logger.info("Precio asignado: ${}", beverage.getPrice());
        });

        order.setStatus("CONFIRMED");
        orders.add(order);
        return order;
    }

    private void validateOrderInput(String beverageName, String size, String customerName) {
        if (beverageName == null || beverageName.trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre de la bebida no puede estar vacío");
        }
        if (size == null || !size.matches("^(small|medium|large)$")) {
            throw new IllegalArgumentException("Tamaño inválido. Use: small, medium o large");
        }
        if (customerName != null && customerName.trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre del cliente no puede estar vacío si se proporciona");
        }
    }

    public List<Order> getAllOrders() {
        return new ArrayList<>(orders);
    }

    public Optional<Order> getOrderById(Long id) {
        return orders.stream().filter(o -> o.getId().equals(id)).findFirst();
    }

    public List<Order> getOrdersByStatus(String status) {
        return orders.stream()
                .filter(o -> o.getStatus().equalsIgnoreCase(status))
                .collect(Collectors.toList());
    }

    public List<Order> getOrdersByCustomer(String customerName) {
        return orders.stream()
                .filter(o -> customerName.equalsIgnoreCase(o.getCustomerName()))
                .collect(Collectors.toList());
    }

    public long countOrdersByStatus(String status) {
        return orders.stream()
                .filter(o -> o.getStatus().equalsIgnoreCase(status))
                .count();
    }

    public double calculateTotalSales() {
        return orders.stream()
                .filter(Order::isConfirmed)
                .filter(o -> o.getPrice() != null)
                .mapToDouble(Order::getPrice)
                .sum();
    }

    public void clearOrders() {
        orders.clear();
        idGenerator.set(1);
    }

    public OrderStatistics getStatistics() {
        long total = orders.size();
        long confirmed = countOrdersByStatus("CONFIRMED");
        long rejected = countOrdersByStatus("REJECTED");
        long pending = countOrdersByStatus("PENDING");
        double totalSales = calculateTotalSales();
        return new OrderStatistics(total, confirmed, rejected, pending, totalSales);
    }

    public static class OrderStatistics {
        private final long totalOrders;
        private final long confirmedOrders;
        private final long rejectedOrders;
        private final long pendingOrders;
        private final double totalSales;

        public OrderStatistics(long total, long confirmed, long rejected, long pending, double totalSales) {
            this.totalOrders = total;
            this.confirmedOrders = confirmed;
            this.rejectedOrders = rejected;
            this.pendingOrders = pending;
            this.totalSales = totalSales;
        }

        public long getTotalOrders() { return totalOrders; }
        public long getConfirmedOrders() { return confirmedOrders; }
        public long getRejectedOrders() { return rejectedOrders; }
        public long getPendingOrders() { return pendingOrders; }
        public double getTotalSales() { return totalSales; }
    }

    public static class BeverageNotFoundException extends RuntimeException {
        public BeverageNotFoundException(String message) {
            super(message);
        }
    }
}

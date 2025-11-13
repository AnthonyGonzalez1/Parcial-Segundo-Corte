package com.virtualcoffeorders.order.service;

import com.virtualcoffeorders.orders.service.BeverageClient;
import com.virtualcoffeorders.orders.service.BeverageClient.BeverageResponse;
import com.virtualcoffeorders.orders.service.BeverageClient.BeverageApiUnavailableException;
import com.virtualcoffeorders.orders.service.OrderService;
import com.virtualcoffeorders.orders.service.OrderService.BeverageNotFoundException;
import com.virtualcoffeorders.orders.service.OrderService.OrderStatistics;
import com.virtualcoffeorders.orders.model.Order;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Tests completos para OrderService usando TDD con JUnit 5 y Mockito
 */

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderService - Tests Completos TDD")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class OrderServiceTest {

    @Mock
    private BeverageClient beverageClient;

    @InjectMocks
    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService.clearOrders();
    }

    @AfterEach
    void tearDown() {
        orderService.clearOrders();
    }

    // ==================== TESTS DE CREACIÓN DE PEDIDOS ====================

    @Nested
    @DisplayName("Crear Pedidos - Casos Exitosos")
    class CreateOrderSuccessTests {

        @Test
        @DisplayName("Debe crear pedido cuando la bebida existe")
        @org.junit.jupiter.api.Order(1)
        void shouldCreateOrderWhenBeverageExists() {
            // Arrange
            when(beverageClient.beverageExists("Cappuccino")).thenReturn(true);

            BeverageResponse beverage = createBeverageResponse("Cappuccino", 4.5);
            when(beverageClient.getBeverage("Cappuccino"))
                    .thenReturn(Optional.of(beverage));

            // Act
            Order order = orderService.createOrder("Cappuccino", "medium", "Juan");

            // Assert
            assertNotNull(order);
            assertEquals("Cappuccino", order.getBeverageName());
            assertEquals("medium", order.getSize());
            assertEquals("Juan", order.getCustomerName());
            assertEquals("CONFIRMED", order.getStatus());
            assertEquals(4.5, order.getPrice());
            assertNotNull(order.getId());
            assertNotNull(order.getCreatedAt());

            verify(beverageClient, times(1)).beverageExists("Cappuccino");
            verify(beverageClient, times(1)).getBeverage("Cappuccino");
        }

        @Test
        @DisplayName("Debe asignar ID único e incremental a cada pedido")
        void shouldAssignUniqueIncrementalIds() {
            // Arrange
            when(beverageClient.beverageExists(anyString())).thenReturn(true);
            when(beverageClient.getBeverage(anyString()))
                    .thenReturn(Optional.of(createBeverageResponse("Test", 3.0)));

            // Act
            Order order1 = orderService.createOrder("Latte", "small", "User1");
            Order order2 = orderService.createOrder("Mocha", "medium", "User2");
            Order order3 = orderService.createOrder("Espresso", "small", "User3");

            // Assert
            assertNotNull(order1.getId());
            assertNotNull(order2.getId());
            assertNotNull(order3.getId());
            assertNotEquals(order1.getId(), order2.getId());
            assertNotEquals(order2.getId(), order3.getId());
            assertTrue(order2.getId() > order1.getId());
            assertTrue(order3.getId() > order2.getId());
        }

        @Test
        @DisplayName("Debe trimear el nombre de la bebida")
        void shouldTrimBeverageName() {
            // Arrange
            when(beverageClient.beverageExists("Americano")).thenReturn(true);
            when(beverageClient.getBeverage("Americano"))
                    .thenReturn(Optional.of(createBeverageResponse("Americano", 3.5)));

            // Act
            Order order = orderService.createOrder("  Americano  ", "large", "Luis");

            // Assert
            assertEquals("Americano", order.getBeverageName());
        }

        @Test
        @DisplayName("Debe aceptar todos los tamaños válidos")
        void shouldAcceptAllValidSizes() {
            // Arrange
            when(beverageClient.beverageExists(anyString())).thenReturn(true);
            when(beverageClient.getBeverage(anyString()))
                    .thenReturn(Optional.of(createBeverageResponse("Test", 3.0)));

            // Act & Assert
            String[] validSizes = { "small", "medium", "large" };
            for (String size : validSizes) {
                Order order = orderService.createOrder("Espresso", size, "Test");
                assertEquals(size, order.getSize());
                assertEquals("CONFIRMED", order.getStatus());
            }
        }

        @Test
        @DisplayName("Debe obtener el precio de la API de bebidas")
        void shouldGetPriceFromBeverageAPI() {
            // Arrange
            when(beverageClient.beverageExists("Premium Coffee")).thenReturn(true);

            BeverageResponse beverage = createBeverageResponse("Premium Coffee", 7.5);
            when(beverageClient.getBeverage("Premium Coffee"))
                    .thenReturn(Optional.of(beverage));

            // Act
            Order order = orderService.createOrder("Premium Coffee", "large", "VIP");

            // Assert
            assertEquals(7.5, order.getPrice());
        }

        @Test
        @DisplayName("Debe permitir nombre de cliente null")
        void shouldAllowNullCustomerName() {
            // Arrange
            when(beverageClient.beverageExists("Coffee")).thenReturn(true);
            when(beverageClient.getBeverage("Coffee"))
                    .thenReturn(Optional.of(createBeverageResponse("Coffee", 3.0)));

            // Act
            Order order = orderService.createOrder("Coffee", "medium", null);

            // Assert
            assertNotNull(order);
            assertNull(order.getCustomerName());
            assertEquals("CONFIRMED", order.getStatus());
        }
    }

    // ==================== TESTS DE VALIDACIONES ====================

    @Nested
    @DisplayName("Validaciones de Entrada")
    class ValidationTests {

        @Test
        @DisplayName("Debe rechazar nombre de bebida vacío")
        void shouldRejectEmptyBeverageName() {
            // Act & Assert
            Exception exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> orderService.createOrder("", "medium", "Pedro"));

            assertTrue(exception.getMessage().contains("vacío"));
            verify(beverageClient, never()).beverageExists(anyString());
        }

        @Test
        @DisplayName("Debe rechazar nombre de bebida null")
        void shouldRejectNullBeverageName() {
            // Act & Assert
            Exception exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> orderService.createOrder(null, "large", "Ana"));

            assertTrue(exception.getMessage().contains("vacío"));
        }

        @Test
        @DisplayName("Debe rechazar nombre de bebida solo con espacios")
        void shouldRejectWhitespaceBeverageName() {
            // Act & Assert
            Exception exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> orderService.createOrder("   ", "small", "Carlos"));

            assertTrue(exception.getMessage().contains("vacío"));
        }

        @Test
        @DisplayName("Debe rechazar tamaño inválido")
        void shouldRejectInvalidSize() {
            // Act & Assert
            Exception exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> orderService.createOrder("Coffee", "extra-large", "User"));

            assertTrue(exception.getMessage().contains("inválido"));
        }

        @Test
        @DisplayName("Debe rechazar tamaño null")
        void shouldRejectNullSize() {
            // Act & Assert
            Exception exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> orderService.createOrder("Coffee", null, "User"));

            assertTrue(exception.getMessage().contains("inválido"));
        }

        @Test
        @DisplayName("Debe rechazar nombre de cliente vacío (si se proporciona)")
        void shouldRejectEmptyCustomerName() {
            // Act & Assert
            Exception exception = assertThrows(
                    IllegalArgumentException.class,
                    () -> orderService.createOrder("Coffee", "medium", "   "));

            assertTrue(exception.getMessage().contains("vacío"));
        }
    }

    // ==================== TESTS DE BEBIDA NO DISPONIBLE ====================

    @Nested
    @DisplayName("Bebida No Disponible")
    class BeverageNotFoundTests {

        @Test
        @DisplayName("Debe rechazar pedido cuando la bebida no existe")
        void shouldRejectOrderWhenBeverageDoesNotExist() {
            // Arrange
            when(beverageClient.beverageExists("NonExistent")).thenReturn(false);

            // Act & Assert
            Exception exception = assertThrows(
                    BeverageNotFoundException.class,
                    () -> orderService.createOrder("NonExistent", "small", "Maria"));

            assertTrue(exception.getMessage().contains("no está disponible"));
            verify(beverageClient, times(1)).beverageExists("NonExistent");
            verify(beverageClient, never()).getBeverage(anyString());
        }

        @Test
        @DisplayName("Debe crear pedido con estado REJECTED cuando bebida no existe")
        void shouldCreateRejectedOrderWhenBeverageNotFound() {
            // Arrange
            when(beverageClient.beverageExists("Invalid")).thenReturn(false);

            // Act
            try {
                orderService.createOrder("Invalid", "medium", "Test");
            } catch (BeverageNotFoundException e) {
                // Expected
            }

            // Assert
            List<Order> orders = orderService.getAllOrders();
            assertEquals(1, orders.size());

            Order rejectedOrder = orders.get(0);
            assertEquals("REJECTED", rejectedOrder.getStatus());
            assertEquals("Invalid", rejectedOrder.getBeverageName());
            assertNotNull(rejectedOrder.getRejectionReason());
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando API de bebidas no está disponible")
        void shouldThrowExceptionWhenBeverageAPIUnavailable() {
            // Arrange
            when(beverageClient.beverageExists(anyString()))
                    .thenThrow(new BeverageApiUnavailableException(
                            "Connection refused", new Exception()));

            // Act & Assert
            assertThrows(BeverageApiUnavailableException.class, () -> {
                orderService.createOrder("Coffee", "medium", "Test");
            });
        }
    }

    // ==================== TESTS DE CONSULTA ====================

    @Nested
    @DisplayName("Consultar Pedidos")
    class QueryOrdersTests {

        @Test
        @DisplayName("Debe retornar lista vacía cuando no hay pedidos")
        void shouldReturnEmptyListWhenNoOrders() {
            // Act
            List<Order> orders = orderService.getAllOrders();

            // Assert
            assertNotNull(orders);
            assertTrue(orders.isEmpty());
        }

        @Test
        @DisplayName("Debe retornar todos los pedidos")
        void shouldReturnAllOrders() {
            // Arrange
            when(beverageClient.beverageExists(anyString())).thenReturn(true);
            when(beverageClient.getBeverage(anyString()))
                    .thenReturn(Optional.of(createBeverageResponse("Test", 4.0)));

            orderService.createOrder("Latte", "medium", "User1");
            orderService.createOrder("Mocha", "large", "User2");
            orderService.createOrder("Espresso", "small", "User3");

            // Act
            List<Order> orders = orderService.getAllOrders();

            // Assert
            assertEquals(3, orders.size());
        }

        @Test
        @DisplayName("Debe encontrar pedido por ID")
        void shouldFindOrderById() {
            // Arrange
            when(beverageClient.beverageExists(anyString())).thenReturn(true);
            when(beverageClient.getBeverage(anyString()))
                    .thenReturn(Optional.of(createBeverageResponse("Test", 4.0)));

            Order created = orderService.createOrder("Tea", "small", "Maria");

            // Act
            Optional<Order> found = orderService.getOrderById(created.getId());

            // Assert
            assertTrue(found.isPresent());
            assertEquals(created.getId(), found.get().getId());
            assertEquals("Tea", found.get().getBeverageName());
        }

        @Test
        @DisplayName("Debe retornar vacío cuando el ID no existe")
        void shouldReturnEmptyWhenIdDoesNotExist() {
            // Act
            Optional<Order> found = orderService.getOrderById(999L);

            // Assert
            assertFalse(found.isPresent());
        }

        @Test
        @DisplayName("Debe filtrar pedidos por estado")
        void shouldFilterOrdersByStatus() {
            // Arrange
            when(beverageClient.beverageExists("Latte")).thenReturn(true);
            when(beverageClient.getBeverage("Latte"))
                    .thenReturn(Optional.of(createBeverageResponse("Latte", 4.0)));
            when(beverageClient.beverageExists("Invalid")).thenReturn(false);

            orderService.createOrder("Latte", "medium", "User1");
            orderService.createOrder("Latte", "large", "User2");

            try {
                orderService.createOrder("Invalid", "small", "User3");
            } catch (BeverageNotFoundException e) {
                // Expected
            }

            // Act
            List<Order> confirmed = orderService.getOrdersByStatus("CONFIRMED");
            List<Order> rejected = orderService.getOrdersByStatus("REJECTED");

            // Assert
            assertEquals(2, confirmed.size());
            assertEquals(1, rejected.size());
        }

        @Test
        @DisplayName("Debe filtrar pedidos por cliente")
        void shouldFilterOrdersByCustomer() {
            // Arrange
            when(beverageClient.beverageExists(anyString())).thenReturn(true);
            when(beverageClient.getBeverage(anyString()))
                    .thenReturn(Optional.of(createBeverageResponse("Test", 3.0)));

            orderService.createOrder("Coffee1", "small", "Alice");
            orderService.createOrder("Coffee2", "medium", "Bob");
            orderService.createOrder("Coffee3", "large", "Alice");

            // Act
            List<Order> aliceOrders = orderService.getOrdersByCustomer("Alice");
            List<Order> bobOrders = orderService.getOrdersByCustomer("Bob");

            // Assert
            assertEquals(2, aliceOrders.size());
            assertEquals(1, bobOrders.size());
        }
    }

    // ==================== TESTS DE ESTADÍSTICAS ====================

    @Nested
    @DisplayName("Estadísticas")
    class StatisticsTests {

        @Test
        @DisplayName("Debe contar pedidos por estado")
        void shouldCountOrdersByStatus() {
            // Arrange
            when(beverageClient.beverageExists("Valid")).thenReturn(true);
            when(beverageClient.getBeverage("Valid"))
                    .thenReturn(Optional.of(createBeverageResponse("Valid", 4.0)));
            when(beverageClient.beverageExists("Invalid")).thenReturn(false);

            orderService.createOrder("Valid", "medium", "User1");
            orderService.createOrder("Valid", "small", "User2");

            try {
                orderService.createOrder("Invalid", "large", "User3");
            } catch (BeverageNotFoundException e) {
            }

            // Act
            long confirmed = orderService.countOrdersByStatus("CONFIRMED");
            long rejected = orderService.countOrdersByStatus("REJECTED");

            // Assert
            assertEquals(2, confirmed);
            assertEquals(1, rejected);
        }

        @Test
        @DisplayName("Debe calcular ventas totales")
        void shouldCalculateTotalSales() {
            // Arrange
            when(beverageClient.beverageExists(anyString())).thenReturn(true);
            when(beverageClient.getBeverage("Coffee1"))
                    .thenReturn(Optional.of(createBeverageResponse("Coffee1", 3.0)));
            when(beverageClient.getBeverage("Coffee2"))
                    .thenReturn(Optional.of(createBeverageResponse("Coffee2", 4.5)));
            when(beverageClient.getBeverage("Coffee3"))
                    .thenReturn(Optional.of(createBeverageResponse("Coffee3", 5.0)));

            orderService.createOrder("Coffee1", "small", "User1");
            orderService.createOrder("Coffee2", "medium", "User2");
            orderService.createOrder("Coffee3", "large", "User3");

            // Act
            double totalSales = orderService.calculateTotalSales();

            // Assert
            assertEquals(12.5, totalSales, 0.01);
        }

        @Test
        @DisplayName("Debe obtener estadísticas completas")
        void shouldGetCompleteStatistics() {
            // Arrange
            when(beverageClient.beverageExists("Valid")).thenReturn(true);
            when(beverageClient.getBeverage("Valid"))
                    .thenReturn(Optional.of(createBeverageResponse("Valid", 5.0)));
            when(beverageClient.beverageExists("Invalid")).thenReturn(false);

            orderService.createOrder("Valid", "medium", "User1");
            orderService.createOrder("Valid", "large", "User2");

            try {
                orderService.createOrder("Invalid", "small", "User3");
            } catch (BeverageNotFoundException e) {
            }

            // Act
            OrderStatistics stats = orderService.getStatistics();

            // Assert
            assertEquals(3, stats.getTotalOrders());
            assertEquals(2, stats.getConfirmedOrders());
            assertEquals(1, stats.getRejectedOrders());
            assertEquals(0, stats.getPendingOrders());
            assertEquals(10.0, stats.getTotalSales(), 0.01);
        }
    }

    // ==================== TESTS DE UTILIDADES ====================

    @Nested
    @DisplayName("Utilidades")
    class UtilityTests {

        @Test
        @DisplayName("Debe limpiar todos los pedidos")
        void shouldClearAllOrders() {
            // Arrange
            when(beverageClient.beverageExists(anyString())).thenReturn(true);
            when(beverageClient.getBeverage(anyString()))
                    .thenReturn(Optional.of(createBeverageResponse("Test", 3.0)));

            orderService.createOrder("Coffee", "small", "User1");
            orderService.createOrder("Tea", "medium", "User2");

            assertEquals(2, orderService.getAllOrders().size());

            // Act
            orderService.clearOrders();

            // Assert
            assertTrue(orderService.getAllOrders().isEmpty());
        }

        @Test
        @DisplayName("Debe reiniciar el contador de IDs al limpiar")
        void shouldResetIdCounterWhenClearing() {
            // Arrange
            when(beverageClient.beverageExists(anyString())).thenReturn(true);
            when(beverageClient.getBeverage(anyString()))
                    .thenReturn(Optional.of(createBeverageResponse("Test", 3.0)));

            orderService.createOrder("Coffee1", "small", "User1");
            orderService.clearOrders();

            // Act
            Order order2 = orderService.createOrder("Coffee2", "medium", "User2");

            // Assert
            assertEquals(1L, order2.getId());
        }
    }

    // ==================== HELPER METHODS ====================

    private BeverageResponse createBeverageResponse(String name, double price) {
        BeverageResponse response = new BeverageResponse();
        response.setName(name);
        response.setPrice(price);
        response.setSize("medium");
        response.setId(1L);
        return response;
    }
}
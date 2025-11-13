package com.virtualcoffeorders.orders.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import java.util.Optional;

/**
 * Cliente para comunicarse con la API de Bebidas (FastAPI)
 */
@Service
public class BeverageClient {

    private static final Logger logger = LoggerFactory.getLogger(BeverageClient.class);

    private final RestTemplate restTemplate;
    private final String beverageApiUrl;

    @Autowired
    public BeverageClient(
            RestTemplate restTemplate,
            @Value("${beverage.api.url:http://localhost:8000}") String beverageApiUrl) {
        this.restTemplate = restTemplate;
        this.beverageApiUrl = beverageApiUrl;
    }

    /**
     * Verifica si una bebida existe en el menú de la API de bebidas
     */
    public boolean beverageExists(String name) {
        try {
            String url = beverageApiUrl + "/menu/" + name;
            logger.info("Checking if beverage exists: {}", name);

            restTemplate.getForObject(url, BeverageResponse.class);
            logger.info("Beverage found: {}", name);
            return true;

        } catch (HttpClientErrorException.NotFound e) {
            logger.warn("Beverage not found: {}", name);
            return false;

        } catch (ResourceAccessException e) {
            logger.error("Cannot connect to Beverages API: {}", e.getMessage());
            throw new BeverageApiUnavailableException(
                    "No se puede conectar con el servicio de bebidas", e
            );
        } catch (Exception e) {
            logger.error("Error checking beverage: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Obtiene información detallada de una bebida
     */
    public Optional<BeverageResponse> getBeverage(String name) {
        try {
            String url = beverageApiUrl + "/menu/" + name;
            logger.info("Fetching beverage details: {}", name);

            BeverageResponse beverage = restTemplate.getForObject(url, BeverageResponse.class);
            return Optional.ofNullable(beverage);

        } catch (HttpClientErrorException.NotFound e) {
            logger.warn("Beverage not found when fetching details: {}", name);
            return Optional.empty();
        } catch (Exception e) {
            logger.error("Error fetching beverage details: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Modelo auxiliar para mapear la respuesta de la API de bebidas
     */
    public static class BeverageResponse {
        private Long id;
        private String name;
        private String size;
        private Double price;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getSize() { return size; }
        public void setSize(String size) { this.size = size; }
        public Double getPrice() { return price; }
        public void setPrice(Double price) { this.price = price; }
    }

    /**
     * Excepción personalizada cuando la API de bebidas no está disponible
     */
    public static class BeverageApiUnavailableException extends RuntimeException {
        public BeverageApiUnavailableException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}

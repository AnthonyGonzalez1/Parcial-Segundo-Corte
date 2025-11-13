package com.virtualcoffeorders;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

/**
 * Clase principal de la aplicación VirtualCoffeeOrders
 * Inicia el servidor de Spring Boot y configura los beans principales.
 */
@SpringBootApplication
public class VirtualCoffeOrdersApplication {

    public static void main(String[] args) {
        SpringApplication.run(VirtualCoffeOrdersApplication.class, args);
    }

    /**
     * Bean que provee un RestTemplate
     * Este se usa para conectar con la API de bebidas (FastAPI)
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

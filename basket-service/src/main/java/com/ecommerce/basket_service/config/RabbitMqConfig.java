package com.ecommerce.basket_service.config;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    public static final String ORDER_CREATED_QUEUE = "order-created-queue";

    @Bean
    public Queue orderCreatedQueue() {
        // Queue otomatik oluşturulur (durable=true)
        return new Queue(ORDER_CREATED_QUEUE, true);
    }
}

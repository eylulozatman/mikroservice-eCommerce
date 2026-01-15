package com.example.inventoryservice.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    public static final String ORDER_EVENTS_EXCHANGE = "order.events";
    public static final String ORDER_FAILED_QUEUE = "inventory-order-failed-queue";

    @Bean
    public TopicExchange orderEventsExchange() {
        return new TopicExchange(ORDER_EVENTS_EXCHANGE);
    }

    @Bean
    public Queue orderFailedQueue() {
        return QueueBuilder.durable(ORDER_FAILED_QUEUE).build();
    }

    @Bean
    public Binding orderFailedBinding(Queue orderFailedQueue, TopicExchange orderEventsExchange) {
        return BindingBuilder.bind(orderFailedQueue).to(orderEventsExchange).with("order.failed");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}

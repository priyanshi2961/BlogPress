package com.blogspot.blog.config;

import feign.Logger;
import feign.codec.ErrorDecoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignConfig {

    @Bean
    Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL;
    }

    @Bean
    public ErrorDecoder errorDecoder() {
        return new CustomErrorDecoder();
    }

    public static class CustomErrorDecoder implements ErrorDecoder {
        @Override
        public Exception decode(String methodKey, feign.Response response) {
            switch (response.status()) {
                case 400:
                    return new RuntimeException("Bad Request");
                case 401:
                    return new RuntimeException("Unauthorized");
                case 403:
                    return new RuntimeException("Forbidden");
                case 404:
                    return new RuntimeException("Not Found");
                case 500:
                    return new RuntimeException("Internal Server Error");
                default:
                    return new RuntimeException("Unknown Error");
            }
        }
    }
}

package com.blogspot.blog.exception;

public class BlogNotFoundException extends RuntimeException {
    public BlogNotFoundException(String message) {
        super(message);
    }
    
    public BlogNotFoundException(Long id) {
        super("Blog not found with id: " + id);
    }
}

package com.blogspot.blog.integration;

import com.blogspot.blog.dto.BlogCreateDto;
import com.blogspot.blog.dto.BlogResponseDto;
import com.blogspot.blog.model.Blog;
import com.blogspot.blog.repository.BlogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.Arrays;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
public class BlogServiceIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private BlogRepository blogRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        blogRepository.deleteAll();
    }

    @Test
    void testGetAllPublishedBlogs() throws Exception {
        // Create a test blog
        Blog blog = Blog.builder()
                .title("Test Blog")
                .content("Test Content")
                .authorId(1L)
                .authorUsername("testuser")
                .isPublished(true)
                .build();
        blogRepository.save(blog);

        // Test the public endpoint
        mockMvc.perform(get("/api/blogs/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].title").value("Test Blog"));
    }

    @Test
    void testCreateBlogValidation() throws Exception {
        BlogCreateDto blogCreateDto = BlogCreateDto.builder()
                .title("") // Invalid: empty title
                .content("Test Content")
                .imageUrls(Arrays.asList("url1", "url2"))
                .build();

        mockMvc.perform(post("/api/blogs")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(blogCreateDto))
                .header("Authorization", "Bearer test-token"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testBlogNotFound() throws Exception {
        mockMvc.perform(get("/api/blogs/public/999"))
                .andExpect(status().isNotFound());
    }
}

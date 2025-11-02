import axios from "axios";

// Use environment variable if available (for Kubernetes), otherwise default to localhost (for local dev)
const API_GATEWAY_URL = import.meta.env.VITE_API_BASE || "http://localhost:8084/api";

const userApi = axios.create({
  baseURL: API_GATEWAY_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const blogApi = axios.create({
  baseURL: API_GATEWAY_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const engagementApi = axios.create({
  baseURL: `${API_GATEWAY_URL}/engagement`,
  headers: {
    "Content-Type": "application/json",
  },
});

export const setAuthToken = (token) => {
  if (token) {
    userApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    blogApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    engagementApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete userApi.defaults.headers.common["Authorization"];
    delete blogApi.defaults.headers.common["Authorization"];
    delete engagementApi.defaults.headers.common["Authorization"];
  }
};

export const userApiService = {
  register: async (userData) => {
    const response = await userApi.post("/users/register", userData);
    return response.data;
  },

  registerAdmin: async (userData) => {
    const response = await userApi.post("/users/register/admin", userData);
    return response.data;
  },

  login: async (loginData) => {
    const response = await userApi.post("/users/login", loginData);
    return response.data;
  },

  getProfile: async () => {
    const response = await userApi.get("/users/profile");
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await userApi.put("/users/profile", profileData);
    return response.data;
  },

  getAllUsers: async () => {
    // Backend returns a plain list (non-paginated)
    const response = await userApi.get(`/users`);
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await userApi.get(`/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await userApi.put(`/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await userApi.delete(`/users/${userId}`);
    return response.data;
  },
};

export const blogApiService = {
  // Public endpoints
  getPublishedBlogs: async (page = 0, size = 10, sort = "createdAt,desc") => {
    const [sortBy, sortDir = "desc"] =
      sort && sort.includes(",")
        ? [sort.split(",")[0], sort.split(",")[1]]
        : [sort || "createdAt", "desc"];
    const response = await blogApi.get(
      `/blogs/public?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`,
      {
        timeout: 30000, // 30 second timeout (blogs with images can take time to load)
      }
    );
    return response.data;
  },

  getPublishedBlogById: async (blogId) => {
    const response = await blogApi.get(`/blogs/public/${blogId}`);
    return response.data;
  },

  searchPublishedBlogs: async (query, page = 0, size = 10) => {
    const response = await blogApi.get(
      `/blogs/public/search?keyword=${encodeURIComponent(
        query
      )}&page=${page}&size=${size}`,
      {
        timeout: 30000, // 30 second timeout
      }
    );
    return response.data;
  },

  // Protected endpoints
  createBlog: async (blogData) => {
    // Use longer timeout for blog creation, especially when images are included
    // Base64 images can make requests large and slow
    const response = await blogApi.post("/blogs", blogData, {
      timeout: 60000, // 60 second timeout for blog creation with images
    });
    return response.data;
  },

  getAllBlogs: async (page = 0, size = 10, sort = "createdAt,desc") => {
    const [sortBy, sortDir = "desc"] =
      sort && sort.includes(",")
        ? [sort.split(",")[0], sort.split(",")[1]]
        : [sort || "createdAt", "desc"];
    const response = await blogApi.get(
      `/blogs?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
    );
    return response.data;
  },

  getBlogById: async (blogId) => {
    const response = await blogApi.get(`/blogs/${blogId}`);
    return response.data;
  },

  updateBlog: async (blogId, blogData) => {
    // Use longer timeout for blog updates, especially when images are included
    const response = await blogApi.put(`/blogs/${blogId}`, blogData, {
      timeout: 60000, // 60 second timeout for blog updates with images
    });
    return response.data;
  },

  deleteBlog: async (blogId) => {
    const response = await blogApi.delete(`/blogs/${blogId}`);
    return response.data;
  },

  getBlogsByAuthor: async (authorId, page = 0, size = 10) => {
    const response = await blogApi.get(
      `/blogs/author/${authorId}?page=${page}&size=${size}`
    );
    return response.data;
  },

  searchBlogs: async (query, page = 0, size = 10) => {
    const response = await blogApi.get(
      `/blogs/search?keyword=${encodeURIComponent(
        query
      )}&page=${page}&size=${size}`
    );
    return response.data;
  },
};

export const engagementApiService = {
  // Likes
  likeBlog: async (blogId) => {
    const res = await engagementApi.post(`/blogs/${blogId}/likes`);
    return res.status;
  },
  unlikeBlog: async (blogId) => {
    const res = await engagementApi.delete(`/blogs/${blogId}/likes`);
    return res.status;
  },
  toggleLike: async (blogId) => {
    const res = await engagementApi.post(`/blogs/${blogId}/likes/toggle`);
    return res.data; // returns boolean: true if liked, false if unliked
  },
  isLiked: async (blogId) => {
    const res = await engagementApi.get(`/blogs/${blogId}/likes/status`);
    return res.data; // returns boolean
  },
  getLikesCount: async (blogId) => {
    const res = await engagementApi.get(`/public/blogs/${blogId}/likes/count`);
    return res.data;
  },

  // Views
  recordView: async (blogId) => {
    try {
      // Views are public endpoints, no authentication required
      // The backend will extract username from JWT token if available
      await engagementApi.post(`/public/blogs/${blogId}/views`);
    } catch (_) {
      // ignore view recording errors
    }
  },
  getViewsCount: async (blogId) => {
    const res = await engagementApi.get(`/public/blogs/${blogId}/views/count`);
    return res.data;
  },

  // Comments - Enhanced API methods for nested comment functionality
  getComments: async (blogId) => {
    try {
      const res = await engagementApi.get(`/public/blogs/${blogId}/comments`);
      return res.data; // Returns nested CommentResponse tree structure
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      throw error;
    }
  },

  getCommentCount: async (blogId) => {
    try {
      const res = await engagementApi.get(
        `/public/blogs/${blogId}/comments/count`
      );
      return res.data;
    } catch (error) {
      console.error("Failed to fetch comment count:", error);
      return 0; // Return 0 on error to prevent UI issues
    }
  },

  addComment: async (blogId, content, parentId = null) => {
    try {
      const payload = {
        blogId: parseInt(blogId),
        content: content.trim(),
        parentId: parentId ? parseInt(parentId) : null,
      };
      const res = await engagementApi.post(
        `/blogs/${blogId}/comments`,
        payload
      );
      return res.data; // Returns created CommentResponse
    } catch (error) {
      console.error("Failed to add comment:", error);
      throw error;
    }
  },

  updateComment: async (blogId, commentId, content) => {
    try {
      const res = await engagementApi.put(
        `/blogs/${blogId}/comments/${commentId}`,
        { content: content.trim() }
      );
      return res.data; // Returns updated CommentResponse
    } catch (error) {
      console.error("Failed to update comment:", error);
      throw error;
    }
  },

  deleteComment: async (blogId, commentId) => {
    try {
      const res = await engagementApi.delete(
        `/blogs/${blogId}/comments/${commentId}`
      );
      return res.status === 200;
    } catch (error) {
      console.error("Failed to delete comment:", error);
      throw error;
    }
  },
};

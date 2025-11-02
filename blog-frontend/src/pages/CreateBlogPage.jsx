import React from "react";
import { blogApiService } from "../services/api";
import BlogForm from "../components/BlogForm";
import Header from "../components/Header";

const CreateBlogPage = () => {
  const handleSubmit = async (blogData) => {
    await blogApiService.createBlog(blogData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <BlogForm onSubmit={handleSubmit} />
    </div>
  );
};

export default CreateBlogPage;

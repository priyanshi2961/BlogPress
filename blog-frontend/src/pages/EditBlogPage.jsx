import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { blogApiService } from "../services/api";
import BlogForm from "../components/BlogForm";
import Header from "../components/Header";

const EditBlogPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const blogData = await blogApiService.getBlogById(id);
        setInitialData({
          title: blogData.title,
          summary: blogData.summary,
          content: blogData.content,
          imageUrls: blogData.imageUrls || [],
        });
      } catch (error) {
        console.error("Failed to fetch blog:", error);
        navigate("/blogs");
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id, navigate]);

  const handleSubmit = async (blogData) => {
    await blogApiService.updateBlog(id, blogData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <div className="card p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <BlogForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isEditing={true}
      />
    </div>
  );
};

export default EditBlogPage;

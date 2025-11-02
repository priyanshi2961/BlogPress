import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Calendar,
  User,
  Eye,
  Heart,
  MessageSquare,
  Edit,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { blogApiService, engagementApiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";
import CommentSection from "../components/CommentSection";

const BlogDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const blogData = isAuthenticated
          ? await blogApiService.getBlogById(id)
          : await blogApiService.getPublishedBlogById(id);
        setBlog(blogData);
      } catch (err) {
        setError("Blog not found or you don't have permission to view it.");
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id, isAuthenticated]);

  // Record view and load engagement data
  useEffect(() => {
    let isMounted = true;
    
    const loadEngagement = async () => {
      try {
        // Record view with time-based deduplication (once per hour per blog)
        const viewedKey = `blog_viewed_${id}`;
        const lastViewTime = localStorage.getItem(viewedKey);
        const now = Date.now();
        const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
        
        // Record view if never viewed or if more than 1 hour has passed
        if (!lastViewTime || (now - parseInt(lastViewTime)) > oneHour) {
          if (isMounted) {
            await engagementApiService.recordView(id);
            localStorage.setItem(viewedKey, now.toString());
          }
        }
        
        if (isMounted) {
          // Load like count
          const count = await engagementApiService.getLikesCount(id);
          setLikeCount(count);
        }
      } catch (e) {
        // ignore engagement errors
      }
    };
    
    loadEngagement();
    
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Load like status separately when authentication changes
  useEffect(() => {
    const loadLikeStatus = async () => {
      if (isAuthenticated) {
        try {
          const liked = await engagementApiService.isLiked(id);
          setIsLiked(liked);
        } catch (e) {
          // ignore errors
        }
      } else {
        setIsLiked(false);
      }
    };
    loadLikeStatus();
  }, [id, isAuthenticated]);

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      alert("Please login to like");
      return;
    }
    try {
      const newIsLiked = await engagementApiService.toggleLike(id);
      setIsLiked(newIsLiked);
      
      // Update like count
      const newCount = await engagementApiService.getLikesCount(id);
      setLikeCount(newCount);
      
      // Also refresh blog data to keep it in sync
      const blogData = isAuthenticated
        ? await blogApiService.getBlogById(id)
        : await blogApiService.getPublishedBlogById(id);
      setBlog(blogData);
    } catch (error) {
      console.error("Error toggling like:", error);
      alert("Failed to toggle like. Please try again.");
    }
  };

  const handleCommentCountChange = async (newCount) => {
    // Refresh blog data to get updated comment count
    try {
      const blogData = isAuthenticated
        ? await blogApiService.getBlogById(id)
        : await blogApiService.getPublishedBlogById(id);
      setBlog(blogData);
    } catch (error) {
      console.error("Error refreshing blog data:", error);
    }
  };


  const handleEdit = () => {
    navigate(`/edit-blog/${id}`);
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this blog?")) {
      try {
        await blogApiService.deleteBlog(id);
        navigate("/blogs");
      } catch (err) {
        alert("Failed to delete blog. Please try again.");
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card p-8 text-center">
            <p className="text-red-600 text-lg mb-4">
              {error || "Blog not found"}
            </p>
            <Link
              to="/blogs"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft size={16} />
              <span>Back to blogs</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canEdit = isAuthenticated && (user?.id === blog.authorId || isAdmin);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/blogs"
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft size={16} />
          <span>Back to blogs</span>
        </Link>

        {/* Blog Content */}
        <div className="card overflow-hidden">
          {/* Blog Header */}
          <div className="p-8 border-b">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{blog.title}</h1>

              {canEdit && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleEdit}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md hover:bg-blue-50"
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-800 px-3 py-1 rounded-md hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
              <div className="flex items-center space-x-1">
                <User size={16} />
                <span>{blog.authorUsername}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar size={16} />
                <span>Published {formatDate(blog.createdAt)}</span>
              </div>
              {blog.updatedAt !== blog.createdAt && (
                <div className="flex items-center space-x-1">
                  <Calendar size={16} />
                  <span>Updated {formatDate(blog.updatedAt)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Eye size={16} />
                <span>{blog.viewCount || 0}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Heart 
                    size={16} 
                    className={isLiked ? "text-red-500 fill-red-500" : "text-gray-500"} 
                  />
                  <span>{likeCount}</span>
                </div>
                {isAuthenticated && (
                  <button 
                    className={`px-3 py-1 rounded-md transition-colors ${
                      isLiked 
                        ? "text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100" 
                        : "text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100"
                    }`}
                    onClick={handleToggleLike}
                  >
                    {isLiked ? "Unlike" : "Like"}
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <MessageSquare size={16} />
                <span>{blog.commentCount || 0}</span>
              </div>
            </div>
          </div>

          {/* Blog Summary */}
          {blog.summary && (
            <div className="p-8 border-b bg-gray-50">
              <p className="text-lg text-gray-700 italic">"{blog.summary}"</p>
            </div>
          )}

          {/* Blog Images */}
          {blog.imageUrls && blog.imageUrls.length > 0 && (
            <div className="p-8 border-b">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blog.imageUrls.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="aspect-video overflow-hidden rounded-lg"
                  >
                    <img
                      src={imageUrl}
                      alt={`Blog image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blog Content */}
          <div className="p-8">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{
                __html: blog.content.replace(/\n/g, "<br />"),
              }}
            />
          </div>

          {/* Blog Footer */}
          <div className="p-8 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <User size={16} />
                  <span>By {blog.authorUsername}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar size={16} />
                  <span>{formatDate(blog.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Eye size={16} />
                  <span>{blog.viewCount || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart 
                    size={16} 
                    className={isLiked ? "text-red-500 fill-red-500" : "text-gray-500"} 
                  />
                  <span>{likeCount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare size={16} />
                  <span>{blog.commentCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <CommentSection 
          blogId={id} 
          onCommentCountChange={handleCommentCountChange}
        />
      </div>
    </div>
  );
};

export default BlogDetailPage;

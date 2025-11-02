import React from "react";
import { Link } from "react-router-dom";
import { Calendar, User, Eye, Heart, MessageSquare } from "lucide-react";

const BlogCard = ({
  blog,
  showAuthor = true,
  showActions = false,
  onEdit,
  onDelete,
}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const thumbnailUrl = (blog.imageUrls || []).find(
    (u) => typeof u === "string" && u.trim().length > 0
  );

  return (
    <div className="card overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {thumbnailUrl && (
        <div className="aspect-video overflow-hidden">
          <img
            src={thumbnailUrl}
            alt={blog.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
            <Link
              to={`/blogs/${blog.id}`}
              className="hover:text-blue-600 transition-colors"
            >
              {blog.title}
            </Link>
          </h3>

          {showActions && (
            <div className="flex space-x-2 ml-4">
              <button
                onClick={onEdit}
                className="text-blue-600 hover:text-blue-800 p-1"
                title="Edit blog"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={onDelete}
                className="text-red-600 hover:text-red-800 p-1"
                title="Delete blog"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {blog.summary && (
          <p className="text-gray-600 mb-4 line-clamp-3">
            {truncateText(blog.summary)}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            {showAuthor && (
              <div className="flex items-center space-x-1">
                <User size={14} />
                <span>{blog.authorUsername}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Calendar size={14} />
              <span>{formatDate(blog.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Eye size={14} />
              <span>{blog.viewCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart size={14} />
              <span>{blog.likeCount || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageSquare size={14} />
              <span>{blog.commentCount}</span>
            </div>
          </div>

          <Link
            to={`/blogs/${blog.id}`}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Read more →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;

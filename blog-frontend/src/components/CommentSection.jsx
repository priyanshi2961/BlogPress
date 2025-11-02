import React, { useState, useEffect } from "react";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { engagementApiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import CommentNode from "./CommentNode";
import {
  getTotalCommentCount,
  sortComments,
  validateComment,
} from "../utils/commentUtils";

const CommentSection = ({ blogId, onCommentCountChange }) => {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("newest"); // newest, oldest
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    loadComments();
  }, [blogId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const cmts = await engagementApiService.getComments(blogId);
      setComments(cmts);
      if (onCommentCountChange) {
        onCommentCountChange(cmts.length);
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!isAuthenticated) {
      alert("Please login to comment");
      return;
    }

    const validation = validateComment(newComment);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setSubmitting(true);
    try {
      await engagementApiService.addComment(blogId, newComment.trim());
      setNewComment("");
      await loadComments();
    } catch (error) {
      console.error("Failed to add comment:", error);
      alert("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId, content) => {
    try {
      await engagementApiService.updateComment(blogId, commentId, content);
      await loadComments();
    } catch (error) {
      console.error("Failed to update comment:", error);
      alert("Failed to update comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await engagementApiService.deleteComment(blogId, commentId);
      await loadComments();
    } catch (error) {
      console.error("Failed to delete comment:", error);
      alert("Failed to delete comment");
    }
  };

  const handleReplyAdded = async () => {
    await loadComments();
  };

  const sortedComments = sortComments(comments, sortOrder);
  const totalCommentCount = getTotalCommentCount(comments);

  if (loading) {
    return (
      <div className="card mt-8">
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card mt-8">
      <div className="p-8 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MessageSquare size={24} className="text-gray-600" />
            <h3 className="text-2xl font-bold text-gray-900">
              Comments ({totalCommentCount})
            </h3>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-500 hover:text-gray-700 p-1"
              title={isCollapsed ? "Expand comments" : "Collapse comments"}
            >
              {isCollapsed ? (
                <ChevronDown size={20} />
              ) : (
                <ChevronUp size={20} />
              )}
            </button>
          </div>

          {comments.length > 1 && !isCollapsed && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <>
            {/* Add Comment Form */}
            {isAuthenticated ? (
              <div className="mb-6">
                <textarea
                  className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  maxLength={1000}
                />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {newComment.length}/1000 characters
                  </span>
                  <button
                    onClick={handleAddComment}
                    disabled={submitting || !newComment.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? "Posting..." : "Post Comment"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-gray-50 rounded-md text-center border-2 border-dashed border-gray-200">
                <MessageSquare
                  size={32}
                  className="mx-auto text-gray-400 mb-2"
                />
                <p className="text-gray-600 font-medium">
                  Join the conversation
                </p>
                <p className="text-gray-500 text-sm">
                  Please login to post a comment.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Comments List */}
      {!isCollapsed && (
        <div className="p-8">
          {sortedComments.length > 0 ? (
            <div className="space-y-6">
              {sortedComments.map((comment) => (
                <CommentNode
                  key={comment.id}
                  comment={comment}
                  blogId={blogId}
                  onUpdate={handleUpdateComment}
                  onDelete={handleDeleteComment}
                  onReplyAdded={handleReplyAdded}
                  depth={0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg font-medium mb-2">
                No comments yet
              </p>
              <p className="text-gray-400">
                Be the first to share your thoughts!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;

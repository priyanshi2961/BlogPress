import React, { useState } from "react";
import { Edit, Trash2, Reply, MoreHorizontal, Heart, Flag } from "lucide-react";
import { engagementApiService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import {
  formatRelativeTime,
  getDepthStyles,
  getAvatarGradient,
  validateComment,
  canModifyComment,
} from "../utils/commentUtils";

const CommentNode = ({
  comment,
  blogId,
  onUpdate,
  onDelete,
  onReplyAdded,
  depth = 0,
}) => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [replyText, setReplyText] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const canModify = canModifyComment(comment, user, isAdmin);
  const maxDepth = 5;
  const isMaxDepth = depth >= maxDepth;

  const handleSaveEdit = async () => {
    const validation = validateComment(editText);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    try {
      await onUpdate(comment.id, editText.trim());
      setIsEditing(false);
    } catch (error) {
      alert("Failed to update comment");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(comment.content);
  };

  const handleReply = async () => {
    const validation = validateComment(replyText);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setSubmittingReply(true);
    try {
      await engagementApiService.addComment(
        blogId,
        replyText.trim(),
        comment.id
      );
      setReplyText("");
      setShowReplyForm(false);
      await onReplyAdded();
    } catch (error) {
      console.error("Failed to add reply:", error);
      alert("Failed to add reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="mb-4">
      <div className={getDepthStyles(depth)}>
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {/* Comment Header */}
              <div className="flex items-center space-x-2 mb-3">
                <div
                  className={`w-8 h-8 bg-gradient-to-br ${getAvatarGradient(
                    comment.username
                  )} rounded-full flex items-center justify-center text-white text-sm font-semibold`}
                >
                  {comment.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">
                      {comment.username}
                    </span>
                    {comment.parentId && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Reply
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{formatRelativeTime(comment.createdAt)}</span>
                    {comment.updatedAt !== comment.createdAt && (
                      <span className="text-gray-400">(edited)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Comment Content */}
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    maxLength={1000}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {editText.length}/1000 characters
                    </span>
                    <div className="space-x-2">
                      <button
                        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm transition-colors"
                        onClick={handleSaveEdit}
                        disabled={!editText.trim()}
                      >
                        Save
                      </button>
                      <button
                        className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm transition-colors"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              )}
            </div>

            {/* Action Menu */}
            <div className="relative ml-4">
              <button
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                onClick={() => setShowActions(!showActions)}
              >
                <MoreHorizontal size={16} />
              </button>

              {showActions && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10 min-w-[120px]">
                  {canModify && !isEditing && (
                    <>
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        onClick={() => {
                          setIsEditing(true);
                          setShowActions(false);
                        }}
                      >
                        <Edit size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        onClick={() => {
                          onDelete(comment.id);
                          setShowActions(false);
                        }}
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                  {isAuthenticated && !isEditing && !isMaxDepth && (
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      onClick={() => {
                        setShowReplyForm(!showReplyForm);
                        setShowActions(false);
                      }}
                    >
                      <Reply size={14} />
                      <span>Reply</span>
                    </button>
                  )}
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    onClick={() => setShowActions(false)}
                  >
                    <Flag size={14} />
                    <span>Report</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {!isEditing && (
            <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-6 text-sm">
                {isAuthenticated && !isMaxDepth && (
                  <button
                    className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                  >
                    <Reply size={14} />
                    <span>{showReplyForm ? "Cancel" : "Reply"}</span>
                  </button>
                )}

                {comment.replies && comment.replies.length > 0 && (
                  <button
                    className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    <span>
                      {isExpanded ? "Hide" : "Show"} {comment.replies.length}{" "}
                      {comment.replies.length === 1 ? "reply" : "replies"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Reply Form */}
          {showReplyForm && isAuthenticated && !isEditing && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex space-x-3">
                <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <textarea
                    className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder={`Reply to ${comment.username}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    maxLength={1000}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {replyText.length}/1000 characters
                    </span>
                    <div className="flex space-x-2">
                      <button
                        className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm transition-colors"
                        onClick={() => {
                          setShowReplyForm(false);
                          setReplyText("");
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                        disabled={!replyText.trim() || submittingReply}
                        onClick={handleReply}
                      >
                        {submittingReply ? "Posting..." : "Reply"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && isExpanded && (
        <div className="mt-3">
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              blogId={blogId}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onReplyAdded={onReplyAdded}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentNode;

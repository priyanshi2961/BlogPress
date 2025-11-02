/**
 * Utility functions for comment handling
 */

/**
 * Format relative time for comments
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted relative time
 */
export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Count total comments including nested replies
 * @param {Array} comments - Array of comment objects
 * @returns {number} - Total comment count
 */
export const getTotalCommentCount = (comments) => {
  return comments.reduce((count, comment) => {
    const countReplies = (replies) => {
      return replies.reduce((acc, reply) => acc + 1 + countReplies(reply.replies || []), 0);
    };
    return count + 1 + countReplies(comment.replies || []);
  }, 0);
};

/**
 * Get depth-based styling classes for nested comments
 * @param {number} depth - Nesting depth
 * @returns {string} - CSS classes
 */
export const getDepthStyles = (depth) => {
  const baseClasses = "border rounded-lg bg-white shadow-sm transition-all duration-200";
  const depthClasses = {
    0: "border-gray-200",
    1: "border-l-4 border-l-blue-200 ml-4",
    2: "border-l-4 border-l-green-200 ml-8",
    3: "border-l-4 border-l-purple-200 ml-12",
    4: "border-l-4 border-l-orange-200 ml-16",
    5: "border-l-4 border-l-red-200 ml-20"
  };
  
  return `${baseClasses} ${depthClasses[Math.min(depth, 5)] || depthClasses[5]}`;
};

/**
 * Generate avatar color based on username
 * @param {string} username - Username
 * @returns {string} - CSS gradient classes
 */
export const getAvatarGradient = (username) => {
  const gradients = [
    "from-blue-500 to-purple-600",
    "from-green-500 to-blue-600",
    "from-purple-500 to-pink-600",
    "from-red-500 to-orange-600",
    "from-indigo-500 to-purple-600",
    "from-teal-500 to-green-600",
    "from-orange-500 to-red-600",
    "from-pink-500 to-rose-600"
  ];
  
  const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
};

/**
 * Sort comments by different criteria
 * @param {Array} comments - Array of comments
 * @param {string} sortOrder - Sort order ('newest', 'oldest')
 * @returns {Array} - Sorted comments
 */
export const sortComments = (comments, sortOrder) => {
  return [...comments].sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
  });
};

/**
 * Validate comment content
 * @param {string} content - Comment content
 * @returns {Object} - Validation result
 */
export const validateComment = (content) => {
  const trimmed = content.trim();
  
  if (!trimmed) {
    return { isValid: false, error: "Comment cannot be empty" };
  }
  
  if (trimmed.length > 1000) {
    return { isValid: false, error: "Comment is too long (max 1000 characters)" };
  }
  
  if (trimmed.length < 2) {
    return { isValid: false, error: "Comment is too short (min 2 characters)" };
  }
  
  return { isValid: true, error: null };
};

/**
 * Extract mentions from comment content
 * @param {string} content - Comment content
 * @returns {Array} - Array of mentioned usernames
 */
export const extractMentions = (content) => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)]; // Remove duplicates
};

/**
 * Highlight mentions in comment content
 * @param {string} content - Comment content
 * @returns {string} - Content with highlighted mentions
 */
export const highlightMentions = (content) => {
  return content.replace(/@(\w+)/g, '<span class="text-blue-600 font-medium">@$1</span>');
};

/**
 * Truncate comment content for preview
 * @param {string} content - Comment content
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated content
 */
export const truncateComment = (content, maxLength = 100) => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + "...";
};

/**
 * Check if user can modify comment
 * @param {Object} comment - Comment object
 * @param {Object} user - Current user
 * @param {boolean} isAdmin - Is user admin
 * @returns {boolean} - Can modify
 */
export const canModifyComment = (comment, user, isAdmin) => {
  if (!user) return false;
  return user.username === comment.username || isAdmin;
};

/**
 * Get comment thread path
 * @param {Object} comment - Comment object
 * @param {Array} allComments - All comments
 * @returns {Array} - Path from root to comment
 */
export const getCommentPath = (comment, allComments) => {
  const path = [comment];
  let current = comment;
  
  while (current.parentId) {
    const parent = findCommentById(allComments, current.parentId);
    if (parent) {
      path.unshift(parent);
      current = parent;
    } else {
      break;
    }
  }
  
  return path;
};

/**
 * Find comment by ID in nested structure
 * @param {Array} comments - Comments array
 * @param {number} commentId - Comment ID to find
 * @returns {Object|null} - Found comment or null
 */
export const findCommentById = (comments, commentId) => {
  for (const comment of comments) {
    if (comment.id === commentId) {
      return comment;
    }
    if (comment.replies && comment.replies.length > 0) {
      const found = findCommentById(comment.replies, commentId);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Calculate comment statistics
 * @param {Array} comments - Comments array
 * @returns {Object} - Statistics object
 */
export const getCommentStats = (comments) => {
  let totalComments = 0;
  let maxDepth = 0;
  let userCounts = {};
  
  const traverse = (commentList, depth = 0) => {
    maxDepth = Math.max(maxDepth, depth);
    
    for (const comment of commentList) {
      totalComments++;
      userCounts[comment.username] = (userCounts[comment.username] || 0) + 1;
      
      if (comment.replies && comment.replies.length > 0) {
        traverse(comment.replies, depth + 1);
      }
    }
  };
  
  traverse(comments);
  
  return {
    totalComments,
    maxDepth,
    uniqueUsers: Object.keys(userCounts).length,
    userCounts,
    mostActiveUser: Object.entries(userCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0])[0]
  };
};

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} username
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
 * @property {"USER" | "ADMIN"} role
 */

/**
 * @typedef {Object} UserRegistrationDto
 * @property {string} username
 * @property {string} email
 * @property {string} password
 * @property {string} firstName
 * @property {string} lastName
 */

/**
 * @typedef {Object} UserLoginDto
 * @property {string} username
 * @property {string} password
 */

/**
 * @typedef {Object} UserProfileDto
 * @property {number} id
 * @property {string} username
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
 * @property {"USER" | "ADMIN"} role
 */

/**
 * @typedef {Object} JwtResponseDto
 * @property {string} token
 * @property {string} type
 * @property {number} userId
 * @property {string} username
 * @property {string} email
 */

/**
 * @typedef {Object} Blog
 * @property {number} id
 * @property {string} title
 * @property {string} content
 * @property {string} summary
 * @property {number} authorId
 * @property {string} authorUsername
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {boolean} isPublished
 * @property {string[]} imageUrls
 * @property {number} likeCount
 * @property {number} commentCount
 * @property {number} viewCount
 */

/**
 * @typedef {Object} BlogCreateDto
 * @property {string} title
 * @property {string} content
 * @property {string} [summary]
 * @property {string[]} [imageUrls]
 */

/**
 * @typedef {Object} BlogUpdateDto
 * @property {string} [title]
 * @property {string} [content]
 * @property {string} [summary]
 * @property {string[]} [imageUrls]
 */

/**
 * @template T
 * @typedef {Object} PaginatedResponse
 * @property {T[]} content
 * @property {number} totalElements
 * @property {number} totalPages
 * @property {number} size
 * @property {number} number
 * @property {boolean} first
 * @property {boolean} last
 * @property {number} numberOfElements
 */

/**
 * @typedef {Object} AuthContextType
 * @property {User | null} user
 * @property {string | null} token
 * @property {function(UserLoginDto): Promise<void>} login
 * @property {function(UserRegistrationDto): Promise<void>} register
 * @property {function(): void} logout
 * @property {boolean} isAuthenticated
 * @property {boolean} isAdmin
 */

export {};

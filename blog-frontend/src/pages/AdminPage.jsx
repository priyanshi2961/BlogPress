import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { userApiService, blogApiService } from "../services/api";
import { Users, FileText, Eye, Edit, Trash2, Plus } from "lucide-react";
import Header from "../components/Header";

const AdminPage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [pagination, setPagination] = useState({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    size: 10,
  });
  const [newAdmin, setNewAdmin] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === "users") {
          const response = await userApiService.getAllUsers();
          setUsers(response);
          setPagination((prev) => ({
            ...prev,
            totalElements: response.length,
            totalPages: Math.max(1, Math.ceil(response.length / prev.size)),
            currentPage: 0,
          }));
        } else {
          const response = await blogApiService.getAllBlogs(
            pagination.currentPage,
            pagination.size
          );
          setBlogs(response.content);
          setPagination({
            totalElements: response.totalElements,
            totalPages: response.totalPages,
            currentPage: response.number,
            size: response.size,
          });
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, pagination.currentPage, pagination.size, isAdmin]);

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await userApiService.deleteUser(userId);
        setUsers(users.filter((user) => user.id !== userId));
      } catch (error) {
        alert("Failed to delete user. Please try again.");
      }
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await userApiService.registerAdmin(newAdmin);
      setNewAdmin({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
      });
      const response = await userApiService.getAllUsers();
      setUsers(response);
    } catch (error) {
      alert("Failed to create admin. Please try again.");
    }
  };

  const startEditUser = (user) => {
    setEditingUser({ ...user });
  };

  const cancelEditUser = () => setEditingUser(null);

  const saveEditUser = async () => {
    try {
      const { id, ...payload } = editingUser;
      await userApiService.updateUser(id, payload);
      const refreshed = await userApiService.getAllUsers();
      setUsers(refreshed);
      setEditingUser(null);
    } catch (error) {
      alert("Failed to update user. Please try again.");
    }
  };

  const handleDeleteBlog = async (blogId) => {
    if (window.confirm("Are you sure you want to delete this blog?")) {
      try {
        await blogApiService.deleteBlog(blogId);
        setBlogs(blogs.filter((blog) => blog.id !== blogId));
      } catch (error) {
        alert("Failed to delete blog. Please try again.");
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage users and blog posts</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("users")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "users"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Users size={16} />
                  <span>Users</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("blogs")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "blogs"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText size={16} />
                  <span>Blogs</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "users" && (
                <div className="p-6 space-y-6">
                  {/* Create Admin */}

                  {/* Users table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700">
                                      {user.firstName?.charAt(0) || "?"}
                                      {user.lastName?.charAt(0) || "?"}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.firstName} {user.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    @{user.username}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.role === "ADMIN"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => startEditUser(user)}
                                className="text-green-600 hover:text-green-900"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Edit modal */}
                  {editingUser && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                      <div className="card p-6 w-full max-w-lg">
                        <h3 className="text-lg font-semibold mb-4">
                          Edit User
                        </h3>
                        <div className="space-y-3">
                          <input
                            className="input"
                            placeholder="Username"
                            value={editingUser.username}
                            onChange={(e) =>
                              setEditingUser({
                                ...editingUser,
                                username: e.target.value,
                              })
                            }
                          />
                          <input
                            className="input"
                            placeholder="Email"
                            type="email"
                            value={editingUser.email}
                            onChange={(e) =>
                              setEditingUser({
                                ...editingUser,
                                email: e.target.value,
                              })
                            }
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              className="input"
                              placeholder="First name"
                              value={editingUser.firstName}
                              onChange={(e) =>
                                setEditingUser({
                                  ...editingUser,
                                  firstName: e.target.value,
                                })
                              }
                            />
                            <input
                              className="input"
                              placeholder="Last name"
                              value={editingUser.lastName}
                              onChange={(e) =>
                                setEditingUser({
                                  ...editingUser,
                                  lastName: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end space-x-2">
                          <button
                            className="btn-secondary"
                            onClick={cancelEditUser}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn-primary"
                            onClick={saveEditUser}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "blogs" && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Blog
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Author
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {blogs.map((blog) => (
                        <tr key={blog.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 overflow-hidden rounded-lg bg-gray-100">
                                {blog.imageUrls && blog.imageUrls.length > 0 ? (
                                  <img
                                    src={blog.imageUrls[0]}
                                    alt={blog.title}
                                    className="h-10 w-10 object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                    <FileText
                                      size={16}
                                      className="text-gray-500"
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {blog.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {blog.summary?.substring(0, 50)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {blog.authorUsername}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                blog.isPublished
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {blog.isPublished ? "Published" : "Draft"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(blog.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => navigate(`/blogs/${blog.id}`)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => navigate(`/edit-blog/${blog.id}`)}
                                className="text-green-600 hover:text-green-900"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteBlog(blog.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() =>
                  setPagination({
                    ...pagination,
                    currentPage: pagination.currentPage - 1,
                  })
                }
                disabled={pagination.currentPage === 0}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="px-3 py-2 text-sm text-gray-700">
                Page {pagination.currentPage + 1} of {pagination.totalPages}
              </span>

              <button
                onClick={() =>
                  setPagination({
                    ...pagination,
                    currentPage: pagination.currentPage + 1,
                  })
                }
                disabled={pagination.currentPage === pagination.totalPages - 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;

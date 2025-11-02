import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  LogOut,
  User,
  Settings,
  Plus,
  Home,
  Search,
  Users,
  BookOpen,
  PlusCircle,
} from "lucide-react";

const Header = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-xl">BP</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">BlogPress</span>
            </Link>

            <nav className="hidden md:flex space-x-2">
              <Link
                to="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50"
              >
                <Home size={18} />
                <span>Home</span>
              </Link>
              <Link
                to="/blogs"
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50"
              >
                <BookOpen size={18} />
                <span>Blogs</span>
              </Link>
              {isAuthenticated && (
                <Link
                  to="/create-blog"
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:scale-105"
                >
                  <PlusCircle size={18} />
                  <span>Write</span>
                </Link>
              )}
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-purple-50"
                  >
                    <Users size={18} />
                    <span>Admin</span>
                  </Link>
                )}

                <div className="relative group">
                  <button className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                      <User size={18} className="text-white" />
                    </div>
                    <span className="hidden md:block text-sm font-medium">
                      {user?.username}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <div className="font-medium">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="text-gray-500">{user?.email}</div>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings size={16} />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-blue-50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105 font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

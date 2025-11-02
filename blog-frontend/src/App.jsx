import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import BlogsPage from "./pages/BlogsPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import CreateBlogPage from "./pages/CreateBlogPage";
import EditBlogPage from "./pages/EditBlogPage";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import Footer from "./components/Footer";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  return isAuthenticated && isAdmin ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/blogs" element={<BlogsPage />} />
      <Route path="/blogs/:id" element={<BlogDetailPage />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/create-blog"
        element={
          <ProtectedRoute>
            <CreateBlogPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-blog/:id"
        element={
          <ProtectedRoute>
            <EditBlogPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <div className="flex-1">
            <AppRoutes />
          </div>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;

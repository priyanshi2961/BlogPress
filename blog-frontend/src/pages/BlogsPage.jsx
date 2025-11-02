import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { blogApiService } from "../services/api";
import BlogCard from "../components/BlogCard";
import Header from "../components/Header";

const BlogsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [blogs, setBlogs] = useState([]);
  const [pagination, setPagination] = useState({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    size: 9,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOption, setSortOption] = useState("createdAt,desc");
  const [loading, setLoading] = useState(true);

  const searchQuery = searchParams.get("search") || "";

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates if component unmounts
    
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        let response;
        if (searchQuery) {
          response = await blogApiService.searchPublishedBlogs(
            searchQuery,
            currentPage,
            pagination.size
          );
        } else {
          response = await blogApiService.getPublishedBlogs(
            currentPage,
            pagination.size,
            sortOption
          );
        }

        // Only update state if component is still mounted
        if (isMounted) {
          if (response && response.content) {
            setBlogs(response.content);
            setPagination({
              totalElements: response.totalElements || 0,
              totalPages: response.totalPages || 0,
              currentPage: response.number || 0,
              size: response.size || pagination.size,
            });
          } else {
            console.error("Invalid response format:", response);
            setBlogs([]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch blogs:", error);
        if (isMounted) {
          setBlogs([]);
          setPagination({
            totalElements: 0,
            totalPages: 0,
            currentPage: 0,
            size: pagination.size,
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBlogs();
    
    // Cleanup function to set flag when component unmounts
    return () => {
      isMounted = false;
    };
    // Removed pagination.size from dependencies to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sortOption, searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const search = formData.get("search");

    if (search) {
      setSearchParams({ search });
    } else {
      setSearchParams({});
    }
    setCurrentPage(0);
  };

  const handleSortChange = (e) => {
    const newSortOption = e.target.value;
    setSortOption(newSortOption);
    setCurrentPage(0); // Reset to first page when sorting changes
  };

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const totalPages = pagination.totalPages;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {searchQuery ? `Search Results for "${searchQuery}"` : "All Blogs"}
          </h1>
          <p className="text-gray-600">
            {searchQuery
              ? `Found ${pagination.totalElements} blog${
                  pagination.totalElements !== 1 ? "s" : ""
                }`
              : "Discover amazing stories from our community"}
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  name="search"
                  defaultValue={searchQuery}
                  placeholder="Search blogs..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </form>

            <div className="flex items-center space-x-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={sortOption}
                onChange={handleSortChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="createdAt,desc">Latest First</option>
                <option value="createdAt,asc">Oldest First</option>
                <option value="title,asc">Title A-Z</option>
                <option value="title,desc">Title Z-A</option>
                <option value="viewCount,desc">Most Viewed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Blogs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(9)].map((_, index) => (
              <div key={index} className="card p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {blogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogs.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {searchQuery
                    ? `No blogs found for "${searchQuery}"`
                    : "No blogs found"}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {[...Array(totalPages)].map((_, index) => {
                    const page = index;
                    const isCurrentPage = page === currentPage;
                    const isNearCurrent = Math.abs(page - currentPage) <= 2;
                    const isFirstPage = page === 0;
                    const isLastPage = page === totalPages - 1;

                    if (
                      isCurrentPage ||
                      isNearCurrent ||
                      isFirstPage ||
                      isLastPage
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-2 border rounded-md text-sm font-medium ${
                            isCurrentPage
                              ? "bg-blue-600 text-white border-blue-600"
                              : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {page + 1}
                        </button>
                      );
                    } else if (
                      (page === currentPage - 3 && currentPage > 3) ||
                      (page === currentPage + 3 && currentPage < totalPages - 4)
                    ) {
                      return (
                        <span key={page} className="px-3 py-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BlogsPage;

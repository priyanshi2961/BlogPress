import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, X, Upload } from "lucide-react";

const blogSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  summary: z.string().optional(),
  content: z.string().min(1, "Content is required"),
});

const BlogForm = ({ initialData, onSubmit, isEditing = false }) => {
  const [imageUrls, setImageUrls] = useState(initialData?.imageUrls || []);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: initialData?.title || "",
      summary: initialData?.summary || "",
      content: initialData?.content || "",
    },
  });

  const handleFormSubmit = async (data) => {
    setError("");
    setLoading(true);
    try {
      const blogData = {
        ...data,
        imageUrls: imageUrls.filter((url) => url.trim() !== ""),
      };
      await onSubmit(blogData);
      navigate("/blogs");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to save blog. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const addImageUrl = () => {
    const trimmedUrl = newImageUrl.trim();
    if (trimmedUrl) {
      // Check if URL is already in the list (case-insensitive)
      const urlExists = imageUrls.some(
        (url) => url.trim().toLowerCase() === trimmedUrl.toLowerCase()
      );
      if (!urlExists) {
        // Basic URL validation
        try {
          new URL(trimmedUrl);
          setImageUrls([...imageUrls, trimmedUrl]);
          setNewImageUrl("");
        } catch (error) {
          setError("Please enter a valid URL (e.g., https://example.com/image.jpg)");
          setTimeout(() => setError(""), 5000);
        }
      } else {
        setError("This image URL has already been added");
        setTimeout(() => setError(""), 3000);
      }
    }
  };

  const removeImageUrl = (index) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  // Compress/resize image to reduce base64 size
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate new dimensions (max 1920px width/height)
          const MAX_DIMENSION = 1920;
          let width = img.width;
          let height = img.height;
          
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = (height / width) * MAX_DIMENSION;
              width = MAX_DIMENSION;
            } else {
              width = (width / height) * MAX_DIMENSION;
              height = MAX_DIMENSION;
            }
          }
          
          // Create canvas and compress
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with quality 0.85 (good balance between quality and size)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file); // Fallback to original if compression fails
              }
            },
            file.type,
            0.85 // Quality: 0.85 (85% quality)
          );
        };
        img.onerror = () => resolve(file); // Fallback to original if image load fails
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file); // Fallback to original if read fails
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith("image/")) {
          setError(`${file.name} is not an image file`);
          setTimeout(() => setError(""), 3000);
          continue;
        }

        // Validate file size (max 2MB to keep base64 data URLs manageable)
        // Base64 encoding increases size by ~33%, so 2MB file becomes ~2.67MB base64
        const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
        if (file.size > MAX_FILE_SIZE) {
          setError(`${file.name} is too large. Maximum size is 2MB`);
          setTimeout(() => setError(""), 3000);
          continue;
        }

        // Compress/resize image if it's too large before converting to base64
        const processedFile = await compressImage(file);
        
        // Convert file to base64 data URL
        const reader = new FileReader();
        await new Promise((resolve, reject) => {
          reader.onload = (e) => {
            const dataUrl = e.target.result;
            // Check if this data URL already exists
            if (!imageUrls.includes(dataUrl)) {
              setImageUrls((prev) => [...prev, dataUrl]);
            }
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(processedFile);
        });
      }
    } catch (err) {
      setError("Failed to upload image. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEditing ? "Edit Blog Post" : "Create New Blog Post"}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div>
            <label htmlFor="title" className="label">
              Title *
            </label>
            <input
              {...register("title")}
              type="text"
              className="input"
              placeholder="Enter blog title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="summary" className="label">
              Summary
            </label>
            <textarea
              {...register("summary")}
              rows={3}
              className="input"
              placeholder="Enter a brief summary of your blog post"
            />
            {errors.summary && (
              <p className="mt-1 text-sm text-red-600">
                {errors.summary.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="content" className="label">
              Content *
            </label>
            <textarea
              {...register("content")}
              rows={12}
              className="input prose"
              placeholder="Write your blog content here..."
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">
                {errors.content.message}
              </p>
            )}
          </div>

          <div>
            <label className="label">Images</label>
            <div className="space-y-3">
              {imageUrls.map((url, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="url"
                    value={url.startsWith("data:") ? url.substring(0, 50) + "..." : url}
                    onChange={(e) => {
                      const newUrls = [...imageUrls];
                      newUrls[index] = e.target.value;
                      setImageUrls(newUrls);
                    }}
                    className="input flex-1"
                    placeholder={url.startsWith("data:") ? "Uploaded image (base64)" : "Enter image URL"}
                    disabled={url.startsWith("data:")}
                  />
                  {url.startsWith("data:") && (
                    <span className="text-xs text-gray-500 px-2">Uploaded</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImageUrl(index)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove image"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
              
              <div className="flex items-center space-x-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addImageUrl();
                    }
                  }}
                  className="input flex-1"
                  placeholder="Enter image URL"
                />
                <button
                  type="button"
                  onClick={triggerFileUpload}
                  disabled={uploading}
                  className={`p-2 rounded-md transition-colors ${
                    uploading
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-green-600 hover:text-green-800 hover:bg-green-50 cursor-pointer"
                  }`}
                  title="Upload image from computer"
                >
                  {uploading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={addImageUrl}
                  disabled={!newImageUrl.trim()}
                  className={`p-2 rounded-md transition-colors ${
                    newImageUrl.trim()
                      ? "text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer"
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                  title={newImageUrl.trim() ? "Add image URL" : "Enter an image URL"}
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Click the upload icon to add images from your computer, or enter an image URL
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/blogs")}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Update Blog"
              ) : (
                "Create Blog"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogForm;

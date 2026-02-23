import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

function CreatePost() {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const navigate = useNavigate();

  const previewUrl = useMemo(() => {
    if (!image) return "";
    return URL.createObjectURL(image);
  }, [image]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setUploadedImageUrl("");

    if (!image) {
      setError("Please select an image.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("caption", caption.trim());
      formData.append("image", image);

      const response = await fetch(`${API_BASE}/create-post`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create post");
      }

      setSuccess("Post created successfully.");
      setUploadedImageUrl(result?.data?.image || "");
      setCaption("");
      setImage(null);

      setTimeout(() => {
        navigate("/");
      }, 900);
    } catch (submitError) {
      setError(submitError.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="create-post-section">
      <div className="panel">
        <h2>Create New Post</h2>
        <p className="section-hint">Upload an image and add a caption.</p>

        <form className="post-form" onSubmit={onSubmit}>
          <label>
            Image
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={(event) => setImage(event.target.files?.[0] || null)}
              required
            />
          </label>

          <label>
            Caption
            <input
              type="text"
              name="caption"
              value={caption}
              placeholder="Write your caption"
              onChange={(event) => setCaption(event.target.value)}
              required
            />
          </label>

          {previewUrl && (
            <div className="preview-card">
              <img src={previewUrl} alt="Preview" />
            </div>
          )}

          {error && <p className="message error">{error}</p>}
          {success && <p className="message success">{success}</p>}

          {uploadedImageUrl && (
            <div className="uploaded-link-box">
              <h3>Original Link</h3>
              <a href={uploadedImageUrl} target="_blank" rel="noreferrer">
                Open uploaded image
              </a>
              <p title={uploadedImageUrl}>{uploadedImageUrl}</p>
            </div>
          )}

          <button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Post"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default CreatePost;
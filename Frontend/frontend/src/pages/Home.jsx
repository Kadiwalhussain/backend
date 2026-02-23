import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE}/posts`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load posts");
      }

      setPosts(Array.isArray(result.data) ? result.data : []);
    } catch (fetchError) {
      setError(fetchError.message || "Unable to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <section className="home-section">
      <div className="section-header">
        <div>
          <h2>Recent Posts</h2>
          <p className="section-hint">Live data from your backend API.</p>
        </div>
        <div className="section-actions">
          <button onClick={loadPosts} type="button" className="ghost-btn">
            Refresh
          </button>
          <Link to="/create-post" className="primary-link">
            + New Post
          </Link>
        </div>
      </div>

      {loading && <p className="state-text">Loading posts...</p>}
      {error && <p className="message error">{error}</p>}

      {!loading && !error && posts.length === 0 && (
        <div className="empty-state">
          <h3>No posts yet</h3>
          <p>Create your first post and it will appear here.</p>
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <div className="posts-grid">
          {posts.map((post) => (
            <article key={post._id} className="post-card">
              <img src={post.image} alt={post.caption || "Post image"} />
              <div className="post-content">
                <p>{post.caption || "No caption"}</p>
                <small>
                  {post.createdAt
                    ? new Date(post.createdAt).toLocaleString()
                    : "Just now"}
                </small>
                <div className="post-links">
                  <a href={post.image} target="_blank" rel="noreferrer">
                    Open Original Image
                  </a>
                  <p title={post.image}>{post.image}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Home;

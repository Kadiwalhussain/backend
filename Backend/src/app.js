const express = require('express');
const multer = require('multer');
const { uploadFile } = require('./services/storage.service');
const postModel = require('./models/post.model');

const app = express();

// ===============================
// Middleware
// ===============================
app.use(express.json());

// ===============================
// Multer Configuration
// ===============================
const upload = multer({
  storage: multer.memoryStorage(),
});

// ===============================
// Health Check Route
// ===============================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running'
  });
});

// ===============================
// Create Post Route
// ===============================
app.post('/create-post', upload.single("image"), async (req, res) => {
  try {
    const { caption } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const result = await uploadFile(file.buffer, file.originalname);

    const post = await postModel.create({
      image: result.url,
      caption: caption,
    });

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: post,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

// ===============================
// Get All Posts
// ===============================
app.get('/posts', async (req, res) => {
  try {
    const posts = await postModel.find();

    return res.status(200).json({
      success: true,
      message: "Posts fetched successfully",
      data: posts,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

module.exports = app;

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, 'Image URL is required']
    },
    caption: {
      type: String,
      required: [true, 'Caption is required']
    }
  },
  {
    timestamps: true
  }
);

const postModel = mongoose.model('post', postSchema);

module.exports = postModel;
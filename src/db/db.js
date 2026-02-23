const mongoose = require('mongoose');
const config = require('../../config/env');

async function connectDB() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
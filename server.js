const app = require('./src/app');
const connectDB = require('./src/db/db');
const config = require('./config/env');

// Start server
async function startServer() {
  try {
    // Connect to database first
    await connectDB();
    
    // Start listening only after DB connection
    const PORT = config.port;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} in ${config.nodeEnv} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
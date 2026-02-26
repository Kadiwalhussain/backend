import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';
import app from './src/app.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Connect to MongoDB and then start the server
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`[+] Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('[-] Failed to connect to MongoDB, starting without DB:', error.message);
        // Optionally start server even if DB fails initially, but usually better to halt
        app.listen(PORT, () => {
            console.log(`[!] Server running on port ${PORT} without DB connection`);
        });
    });

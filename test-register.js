import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        console.log("Connected, creating user...");
        const user = await User.create({ name: 'test', email: `test_${Date.now()}@test.com`, password: 'password', role: 'listener' });
        console.log("Success", user);
    } catch (e) {
        console.error("Error creating user:", e);
    }
    process.exit();
}).catch(e => {
    console.error("Connection error:", e);
    process.exit(1);
});

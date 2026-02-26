import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);

    // Create an artist user
    const email = `artist_${Date.now()}@test.com`;
    const user = await User.create({
        name: 'Test Artist',
        email,
        password: 'password',
        role: 'artist'
    });
    console.log("Artist created:", email);

    // Login to get token cookie
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
        email,
        password: 'password'
    });
    const cookie = loginRes.headers['set-cookie'][0];
    console.log("Logged in, cookie:", cookie);

    // Create a dummy file
    fs.writeFileSync('dummy.mp3', 'dummy audio content');

    // Upload file
    console.log("Uploading file...");
    const form = new FormData();
    form.append('file', fs.createReadStream('dummy.mp3'));

    try {
        const uploadRes = await axios.post('http://localhost:3000/api/upload', form, {
            headers: {
                ...form.getHeaders(),
                Cookie: cookie
            }
        });
        console.log("Upload Success:", uploadRes.data);

        // Create song
        console.log("Creating song record...");
        const songRes = await axios.post('http://localhost:3000/api/songs', {
            title: 'Test Song',
            duration: 120,
            audioUrl: uploadRes.data.data.url,
            imageUrl: 'default-song.png'
        }, {
            headers: { Cookie: cookie }
        });
        console.log("Song Created:", songRes.data);

    } catch (e) {
        console.error("API Error:");
        if (e.response) {
            console.error(e.response.status, e.response.data);
        } else {
            console.error(e.message);
        }
    }

    fs.unlinkSync('dummy.mp3');
    process.exit(0);
}

run();

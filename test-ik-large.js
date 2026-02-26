import imagekit from './src/config/imagekit.js';
import crypto from 'crypto';

async function testUpload() {
    try {
        // Create 2MB buffer
        const dummyBuffer = crypto.randomBytes(2 * 1024 * 1024);
        console.log("Starting ImageKit upload for 2MB file...");
        const result = await imagekit.upload({
            file: dummyBuffer,
            fileName: 'test-large.mp3',
            folder: '/spotify_clone',
        });
        console.log("Success:", result.url, result.size);
    } catch (e) {
        console.error("ImageKit error:", e);
    }
}
testUpload();

import imagekit from './src/config/imagekit.js';

async function testUpload() {
    try {
        const dummyBuffer = Buffer.from('hello world');
        console.log("Starting ImageKit upload...");
        const result = await imagekit.upload({
            file: dummyBuffer,
            fileName: 'test-upload.txt',
            folder: '/spotify_clone',
        });
        console.log("Success:", result);
    } catch (e) {
        console.error("ImageKit error:", e);
    }
}
testUpload();

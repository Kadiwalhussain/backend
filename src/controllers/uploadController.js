import imagekit from '../config/imagekit.js';

// @desc    Get ImageKit auth parameters for client-side upload
// @route   GET /api/upload/auth
// @access  Private (Artist only)
export const getImageKitAuth = (req, res) => {
    try {
        const result = imagekit.getAuthenticationParameters();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'ImageKit Auth Failed', error: error.message });
    }
};

// @desc    Upload file to ImageKit (Server-side)
// @route   POST /api/upload
// @access  Private (Artist only)
export const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        const result = await imagekit.upload({
            file: req.file.buffer, // required, from multer
            fileName: req.file.originalname,   // required
            folder: '/spotify_clone', // optional
        });

        res.status(200).json({
            success: true,
            data: {
                url: result.url,
                fileId: result.fileId,
                name: result.name
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
    }
};

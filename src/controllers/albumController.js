import Album from '../models/Album.js';

// @desc    Get all albums
// @route   GET /api/albums
// @access  Public
export const getAlbums = async (req, res) => {
    try {
        const albums = await Album.find().populate('artist', 'name');
        res.status(200).json({ success: true, count: albums.length, data: albums });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get single album
// @route   GET /api/albums/:id
// @access  Public
export const getAlbum = async (req, res) => {
    try {
        const album = await Album.findById(req.params.id).populate('artist', 'name').populate('songs');
        if (!album) return res.status(404).json({ success: false, message: 'Album not found' });
        res.status(200).json({ success: true, data: album });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Create new album
// @route   POST /api/albums
// @access  Private (Artist only)
export const createAlbum = async (req, res) => {
    try {
        req.body.artist = req.user.id;
        const album = await Album.create(req.body);
        res.status(201).json({ success: true, data: album });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

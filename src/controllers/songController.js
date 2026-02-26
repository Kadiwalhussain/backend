import Song from '../models/Song.js';
import User from '../models/User.js';

// @desc    Get all songs
// @route   GET /api/songs
// @access  Public
export const getSongs = async (req, res) => {
    try {
        const songs = await Song.find().populate('artist', 'name');
        res.status(200).json({ success: true, count: songs.length, data: songs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get single song
// @route   GET /api/songs/:id
// @access  Public
export const getSong = async (req, res) => {
    try {
        const song = await Song.findById(req.params.id).populate('artist', 'name');
        if (!song) return res.status(404).json({ success: false, message: 'Song not found' });
        res.status(200).json({ success: true, data: song });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Create new song
// @route   POST /api/songs
// @access  Private (Artist only)
export const createSong = async (req, res) => {
    try {
        req.body.artist = req.user.id; // From authMiddleware
        const song = await Song.create(req.body);
        res.status(201).json({ success: true, data: song });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Update a song
// @route   PUT /api/songs/:id
// @access  Private (Artist only)
export const updateSong = async (req, res) => {
    try {
        let song = await Song.findById(req.params.id);
        if (!song) return res.status(404).json({ success: false, message: 'Song not found' });

        // Make sure user is song artist
        if (song.artist.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this song' });
        }

        song = await Song.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        res.status(200).json({ success: true, data: song });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Delete a song
// @route   DELETE /api/songs/:id
// @access  Private (Artist only)
export const deleteSong = async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        if (!song) return res.status(404).json({ success: false, message: 'Song not found' });

        // Make sure user is song artist
        if (song.artist.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this song' });
        }

        await song.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

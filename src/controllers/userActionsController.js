import Playlist from '../models/Playlist.js';
import User from '../models/User.js';

// @desc    Get user's playlists
// @route   GET /api/my/playlists
// @access  Private
export const getMyPlaylists = async (req, res) => {
    try {
        const playlists = await Playlist.find({ owner: req.user.id });
        res.status(200).json({ success: true, data: playlists });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Create playlist
// @route   POST /api/my/playlists
// @access  Private
export const createPlaylist = async (req, res) => {
    try {
        req.body.owner = req.user.id;
        const playlist = await Playlist.create(req.body);
        res.status(201).json({ success: true, data: playlist });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Add song to playlist
// @route   PUT /api/my/playlists/:id/add
// @access  Private
export const addSongToPlaylist = async (req, res) => {
    try {
        const playlist = await Playlist.findOne({ _id: req.params.id, owner: req.user.id });
        if (!playlist) return res.status(404).json({ success: false, message: 'Playlist not found' });

        const { songId } = req.body;
        if (!playlist.songs.includes(songId)) {
            playlist.songs.push(songId);
            await playlist.save();
        }

        res.status(200).json({ success: true, data: playlist });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Like a song
// @route   POST /api/my/liked/:songId
// @access  Private
export const toggleLikeSong = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { songId } = req.params;

        if (user.likedSongs.includes(songId)) {
            user.likedSongs = user.likedSongs.filter(id => id.toString() !== songId);
        } else {
            user.likedSongs.push(songId);
        }
        await user.save();

        res.status(200).json({ success: true, likedSongs: user.likedSongs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

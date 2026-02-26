import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a playlist name'],
        trim: true,
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    owner: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    isPublic: {
        type: Boolean,
        default: false,
    },
    songs: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Song',
    }]
}, {
    timestamps: true,
});

const Playlist = mongoose.model('Playlist', playlistSchema);
export default Playlist;

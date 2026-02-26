import mongoose from 'mongoose';

const songSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a song title'],
        trim: true,
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    artist: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    album: {
        type: mongoose.Schema.ObjectId,
        ref: 'Album',
        default: null,
    },
    audioUrl: {
        type: String,
        required: [true, 'Please provide the audio URL'],
    },
    imageUrl: {
        type: String,
        default: 'default-song.png',
    },
    duration: {
        type: Number, // duration in seconds
        default: 0,
    },
    plays: {
        type: Number,
        default: 0,
    }
}, {
    timestamps: true,
});

const Song = mongoose.model('Song', songSchema);
export default Song;

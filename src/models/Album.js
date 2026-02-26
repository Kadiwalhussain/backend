import mongoose from 'mongoose';

const albumSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide an album title'],
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
    coverImageUrl: {
        type: String,
        default: 'default-album.png',
    },
    songs: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Song',
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Album = mongoose.model('Album', albumSchema);
export default Album;

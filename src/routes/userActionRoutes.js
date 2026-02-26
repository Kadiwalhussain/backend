import express from 'express';
import { getMyPlaylists, createPlaylist, addSongToPlaylist, toggleLikeSong } from '../controllers/userActionsController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect); // All routes below are protected

router.route('/playlists')
    .get(getMyPlaylists)
    .post(createPlaylist);

router.put('/playlists/:id/add', addSongToPlaylist);
router.post('/liked/:songId', toggleLikeSong);

export default router;

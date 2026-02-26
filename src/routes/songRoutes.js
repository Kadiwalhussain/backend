import express from 'express';
import { getSongs, getSong, createSong, updateSong, deleteSong } from '../controllers/songController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getSongs)
    .post(protect, authorize('artist'), createSong);

router.route('/:id')
    .get(getSong)
    .put(protect, authorize('artist'), updateSong)
    .delete(protect, authorize('artist'), deleteSong);

export default router;

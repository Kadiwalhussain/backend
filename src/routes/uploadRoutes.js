import express from 'express';
import multer from 'multer';
import { getImageKitAuth, uploadFile } from '../controllers/uploadController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.use(protect);
router.use(authorize('artist')); // Only artists can upload

router.get('/auth', getImageKitAuth);
router.post('/', upload.single('file'), uploadFile);

export default router;

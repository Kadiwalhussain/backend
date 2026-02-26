import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { axiosInstance } from '../lib/axios';
import { UploadCloud, Music, Image as ImageIcon, Loader2, ShieldAlert } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';

const ArtistDashboard = () => {
    const navigate = useNavigate();
    const { authUser } = useAuthStore();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [formData, setFormData] = useState({
        title: '',
        duration: 0,
    });

    const [audioFile, setAudioFile] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    const onAudioDrop = useCallback(acceptedFiles => {
        if (acceptedFiles?.[0]) {
            setAudioFile(acceptedFiles[0]);
        }
    }, []);

    const onImageDrop = useCallback(acceptedFiles => {
        if (acceptedFiles?.[0]) {
            setImageFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps: getAudioProps, getInputProps: getAudioInputProps, isDragActive: audioDrag } = useDropzone({
        onDrop: onAudioDrop,
        accept: { 'audio/*': [] },
        maxFiles: 1
    });

    const { getRootProps: getImageProps, getInputProps: getImageInputProps, isDragActive: imageDrag } = useDropzone({
        onDrop: onImageDrop,
        accept: { 'image/*': [] },
        maxFiles: 1
    });

    const getAudioDuration = (file) => {
        return new Promise((resolve) => {
            const url = URL.createObjectURL(file);
            const audio = new Audio(url);
            audio.addEventListener('loadedmetadata', () => {
                resolve(Math.round(audio.duration));
            });
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!audioFile) {
            toast.error("Please select an audio file to upload");
            return;
        }

        try {
            setIsUploading(true);
            setUploadProgress(0);

            // 1. Upload Image (Optional)
            let uploadedImageUrl = 'default-song.png';
            if (imageFile) {
                setUploadStatus('Uploading cover image...');
                const imageFormData = new FormData();
                imageFormData.append('file', imageFile);
                const imgRes = await axiosInstance.post('/upload', imageFormData);
                uploadedImageUrl = imgRes.data.data.url;
            }

            // 2. Upload Audio
            setUploadStatus('Uploading audio file...');
            const audioFormData = new FormData();
            audioFormData.append('file', audioFile);

            const audioRes = await axiosInstance.post('/upload', audioFormData, {
                timeout: 120000, // 120 seconds for large audio
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });
            const uploadedAudioUrl = audioRes.data.data.url;

            // Calculate duration if not provided
            let durationSecs = formData.duration;
            if (!durationSecs || durationSecs === 0) {
                setUploadStatus('Calculating duration...');
                durationSecs = await getAudioDuration(audioFile);
            }

            // 3. Create Song record
            setUploadStatus('Finalizing song details...');
            await axiosInstance.post('/songs', {
                title: formData.title,
                duration: durationSecs,
                audioUrl: uploadedAudioUrl,
                imageUrl: uploadedImageUrl
            });

            setUploadStatus('Completed!');
            toast.success("Song published successfully!");
            setTimeout(() => {
                navigate('/');
            }, 1000);

        } catch (error) {
            console.error("Upload Error Details:", error);

            let errorMessage = "Failed to upload song";
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = typeof error.response.data.error === 'string' ? error.response.data.error : JSON.stringify(error.response.data.error);
            } else if (error.message) {
                errorMessage = `Upload failed: ${error.message}`;
            }

            toast.error(errorMessage);
            setIsUploading(false);
            setUploadStatus('');
            setUploadProgress(0);
        }
    };

    return (
        <div className="text-white max-w-4xl mx-auto pt-6 pb-20">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Artist Dashboard</h1>

            {/* Role Guard — show a clear message if user isn't an artist */}
            {authUser && authUser.role !== 'artist' && (
                <div className="bg-[#181818] rounded-xl p-10 border border-red-800/50 flex flex-col items-center text-center gap-5">
                    <ShieldAlert className="w-16 h-16 text-red-500" />
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Artist Account Required</h2>
                        <p className="text-textSecondary max-w-md">
                            Your current account is registered as a <span className="text-white font-semibold">Listener</span>.
                            Only Artist accounts can upload music. Please register a new account and select <span className="text-primary font-semibold">Artist / Creator</span> during sign-up.
                        </p>
                    </div>
                    <Link to="/register" className="mt-2 py-3 px-8 bg-primary rounded-full font-bold text-black hover:scale-105 transition-transform">
                        Create Artist Account
                    </Link>
                </div>
            )}

            {authUser && authUser.role === 'artist' && (
                <div className="bg-[#181818] rounded-xl p-8 border border-[#282828] shadow-2xl">
                    <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                        <UploadCloud className="w-8 h-8 text-primary" />
                        Upload New Release
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Audio Upload */}
                        <div>
                            <label className="block text-sm font-bold mb-3">Audio Track *</label>
                            <div
                                {...getAudioProps()}
                                className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${audioDrag ? 'border-primary bg-primary/10' : 'border-[#404040] hover:border-gray-500 bg-[#242424]'}`}
                            >
                                <input {...getAudioInputProps()} />
                                <Music className="w-12 h-12 text-textSecondary mb-4" />
                                {audioFile ? (
                                    <p className="text-primary font-medium">{audioFile.name}</p>
                                ) : (
                                    <div className="text-center">
                                        <p className="font-medium text-white mb-1">Click to select or drop audio file here</p>
                                        <p className="text-sm text-textSecondary">Supports MP3, WAV, AAC</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-bold mb-3">Cover Art (Optional)</label>
                            <div
                                {...getImageProps()}
                                className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${imageDrag ? 'border-primary bg-primary/10' : 'border-[#404040] hover:border-gray-500 bg-[#242424]'}`}
                            >
                                <input {...getImageInputProps()} />
                                <ImageIcon className="w-12 h-12 text-textSecondary mb-4" />
                                {imageFile ? (
                                    <p className="text-primary font-medium">{imageFile.name}</p>
                                ) : (
                                    <div className="text-center">
                                        <p className="font-medium text-white mb-1">Click to select or drop image here</p>
                                        <p className="text-sm text-textSecondary">Supports JPG, PNG (1:1 aspect ratio recommended)</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold mb-2">Song Title *</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Name of your track"
                                    className="w-full bg-[#242424] border border-[#404040] rounded py-3 px-4 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">Duration (Seconds) - Optional</label>
                                <input
                                    type="number"
                                    placeholder="Auto-calculated if left 0"
                                    className="w-full bg-[#242424] border border-[#404040] rounded py-3 px-4 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isUploading}
                            className="w-full relative flex items-center justify-center gap-2 py-4 px-4 rounded-full font-bold text-black bg-primary hover:scale-[1.02] transition-transform disabled:opacity-100 disabled:hover:scale-100 disabled:cursor-not-allowed overflow-hidden"
                        >
                            {isUploading && (
                                <div
                                    className="absolute left-0 top-0 bottom-0 bg-green-600 transition-all duration-300 ease-out"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {uploadStatus} {uploadProgress > 0 && uploadProgress < 100 ? `(${uploadProgress}%)` : ''}
                                    </>
                                ) : (
                                    'Publish Track'
                                )}
                            </span>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ArtistDashboard;

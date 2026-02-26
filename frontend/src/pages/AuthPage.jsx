import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';

const AuthPage = ({ isLogin }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        role: 'listener'
    });
    const { login, register, error } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = isLogin ? await login(formData) : await register(formData);
        if (success) {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center py-12 sm:px-6 lg:px-8 text-white">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-4xl font-extrabold pb-8 tracking-tight">
                    {isLogin ? 'Log in to Spotify' : 'Sign up to start listening'}
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md w-full px-4">
                <div className="bg-black py-8 px-4 shadow rounded-lg sm:px-10 border border-[#282828]">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-bold text-white mb-2">What should we call you?</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Enter a profile name."
                                    className="w-full bg-[#121212] border border-[#727272] rounded py-3 px-4 text-white hover:border-white focus:border-white focus:outline-none focus:ring-2 focus:ring-white transition-colors"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-white mb-2">Email address</label>
                            <input
                                required
                                type="email"
                                placeholder="name@domain.com"
                                className="w-full bg-[#121212] border border-[#727272] rounded py-3 px-4 text-white hover:border-white focus:border-white focus:outline-none focus:ring-2 focus:ring-white transition-colors"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-white mb-2">Password</label>
                            <input
                                required
                                type="password"
                                placeholder="Password"
                                className="w-full bg-[#121212] border border-[#727272] rounded py-3 px-4 text-white hover:border-white focus:border-white focus:outline-none focus:ring-2 focus:ring-white transition-colors"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-bold text-white mb-3">Account Type</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="listener"
                                            checked={formData.role === 'listener'}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-4 h-4 text-primary bg-[#121212] border-gray-600 focus:ring-primary focus:ring-2"
                                        />
                                        <span className="text-sm">Listener</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="artist"
                                            checked={formData.role === 'artist'}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-4 h-4 text-primary bg-[#121212] border-gray-600 focus:ring-primary focus:ring-2"
                                        />
                                        <span className="text-sm">Artist / Creator</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                        <button
                            type="submit"
                            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-full shadow-sm text-base font-bold text-black bg-primary hover:scale-[1.04] transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                            {isLogin ? 'Log In' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm">
                        <hr className="border-[#282828] mb-6" />
                        {isLogin ? (
                            <p className="text-textSecondary">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-white hover:underline font-bold hover:text-primary transition-colors">
                                    Sign up for Spotify
                                </Link>
                            </p>
                        ) : (
                            <p className="text-textSecondary">
                                Already have an account?{' '}
                                <Link to="/login" className="text-white hover:underline font-bold hover:text-primary transition-colors">
                                    Log in here
                                </Link>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;

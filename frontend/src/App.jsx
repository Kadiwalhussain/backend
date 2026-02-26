import { useEffect } from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import MainLayout from './components/MainLayout';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ArtistDashboard from './pages/ArtistDashboard';
import { Toaster } from 'react-hot-toast';

function App() {
  const { checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#333',
          color: '#fff',
        },
      }} />
      <Routes>
        <Route path="/login" element={<AuthPage isLogin={true} />} />
        <Route path="/register" element={<AuthPage isLogin={false} />} />

        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/artist/dashboard" element={<ArtistDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

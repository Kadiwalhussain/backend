import { Toaster } from "react-hot-toast";
import AppErrorBoundary from "../components/layout/AppErrorBoundary";
import AppBootstrapGate from "../components/layout/AppBootstrapGate";
import RateLimitNotice from "../components/ui/RateLimitNotice";
import SessionExpiredModal from "../components/ui/SessionExpiredModal";
import ThemeControls from "../components/ui/ThemeControls";
import { APP_NAME } from "../config/constants";
import { AccountProvider } from "../context/AccountContext";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useGlobalMonitoring } from "../hooks/useGlobalMonitoring";
import Router from "./router";
import GlobalErrorBanner from "../components/ui/GlobalErrorBanner";

const AppContent = () => {
  useGlobalMonitoring();
  const { sessionExpired, dismissSessionExpired, rateLimitUntil } = useAuth();

  return (
    <>
      <GlobalErrorBanner />
      <RateLimitNotice rateLimitUntil={rateLimitUntil} />
      <SessionExpiredModal open={sessionExpired} onClose={dismissSessionExpired} />
      <AppBootstrapGate>
        <Router />
      </AppBootstrapGate>
      <ThemeControls />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#111827",
            color: "#f8fafc",
            border: "1px solid #334155",
          },
        }}
      />
      <span className="sr-only">{APP_NAME}</span>
    </>
  );
};

const App = () => {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AccountProvider>
            <AppContent />
          </AccountProvider>
        </AuthProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
};

export default App;




//working update


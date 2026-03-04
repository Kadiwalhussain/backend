import { Navigate, Outlet, useLocation } from "react-router-dom";
import { APP_ROUTES } from "../../config/routes";
import { useAuth } from "../../context/AuthContext";
import { useAccount } from "../../context/AccountContext";
import LoadingOverlay from "../ui/LoadingOverlay";

const ProtectedRoute = () => {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const { loading: accountLoading } = useAccount();

  if (loading || (isAuthenticated && accountLoading)) {
    return <LoadingOverlay fullScreen label="Verifying secure session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={APP_ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

import { lazy, Suspense } from "react";
import { useRoutes } from "react-router-dom";
import LoadingOverlay from "../components/ui/LoadingOverlay";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import { APP_ROUTES } from "../config/routes";

const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const HomePage = lazy(() => import("../pages/HomePage"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const TransactionsPage = lazy(() => import("../pages/TransactionsPage"));
const TransferPage = lazy(() => import("../pages/TransferPage"));
const VerifyOtpPage = lazy(() => import("../pages/VerifyOtpPage"));

const withSuspense = (element) => (
  <Suspense fallback={<LoadingOverlay fullScreen label="Loading page..." />}>{element}</Suspense>
);

const Router = () => {
  return useRoutes([
    { path: APP_ROUTES.HOME, element: withSuspense(<HomePage />) },
    { path: APP_ROUTES.REGISTER, element: withSuspense(<RegisterPage />) },
    { path: APP_ROUTES.LOGIN, element: withSuspense(<LoginPage />) },
    { path: APP_ROUTES.VERIFY_OTP, element: withSuspense(<VerifyOtpPage />) },
    {
      element: <ProtectedRoute />,
      children: [
        { path: APP_ROUTES.DASHBOARD, element: withSuspense(<DashboardPage />) },
        { path: APP_ROUTES.TRANSFER, element: withSuspense(<TransferPage />) },
        { path: APP_ROUTES.TRANSACTIONS, element: withSuspense(<TransactionsPage />) },
        { path: APP_ROUTES.PROFILE, element: withSuspense(<ProfilePage />) },
      ],
    },
    { path: "*", element: withSuspense(<NotFoundPage />) },
  ]);
};

export default Router;

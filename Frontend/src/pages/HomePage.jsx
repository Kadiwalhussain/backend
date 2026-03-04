import { Link, Navigate } from "react-router-dom";

import { APP_ROUTES } from "../config/routes";
import { useAuth } from "../context/AuthContext";

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={APP_ROUTES.DASHBOARD} replace />;
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900/80 p-8 text-center shadow-soft">
        <h1 className="text-3xl font-semibold text-white">Digital Banking Onboarding</h1>
        <p className="mt-3 text-sm text-slate-300">
          Secure OTP-based signup with cookie auth and instant welcome credit flow.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to={APP_ROUTES.REGISTER}
            className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-ink"
          >
            Create account
          </Link>
          <Link
            to={APP_ROUTES.LOGIN}
            className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200"
          >
            Login
          </Link>
        </div>
      </div>
    </main>
  );
};

export default HomePage;

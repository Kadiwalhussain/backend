import { Link } from "react-router-dom";
import { APP_ROUTES } from "../config/routes";

const NotFoundPage = () => {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center shadow-soft">
        <h1 className="text-3xl font-semibold text-white">404</h1>
        <p className="mt-2 text-sm text-slate-300">The requested page does not exist.</p>
        <Link
          to={APP_ROUTES.HOME}
          className="mt-6 inline-flex rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-brand-ink transition hover:bg-brand-primary/90"
        >
          Go home
        </Link>
      </div>
    </main>
  );
};

export default NotFoundPage;

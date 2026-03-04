import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import AuthLayout from "../components/layout/AuthLayout";
import LoadingButton from "../components/ui/LoadingButton";
import LoadingOverlay from "../components/ui/LoadingOverlay";
import { AUTH_LIMITS } from "../config/constants";
import { APP_ROUTES } from "../config/routes";
import { useAuth } from "../context/AuthContext";
import { setPendingOtpEmail } from "../utils/auth-flow";
import { loginSchema } from "../utils/validators";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();

  const [attempts, setAttempts] = useState(0);
  const [lockSeconds, setLockSeconds] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!lockSeconds) return;

    const timer = setInterval(() => {
      setLockSeconds((value) => {
        if (value <= 1) {
          clearInterval(timer);
          setAttempts(0);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockSeconds]);

  const isLocked = lockSeconds > 0;
  const nextRoute = useMemo(
    () => location.state?.from?.pathname || APP_ROUTES.DASHBOARD,
    [location.state?.from?.pathname]
  );

  if (isAuthenticated) {
    return <Navigate to={APP_ROUTES.DASHBOARD} replace />;
  }

  const onSubmit = async (values) => {
    if (isLocked) return;

    try {
      await login(values);
      toast.success("Secure login successful");
      navigate(nextRoute, { replace: true });
    } catch (error) {
      const status = error?.response?.status;
      const code = error?.response?.data?.code;
      const message = error?.response?.data?.message;

      if (status === 403 && code === "ACCOUNT_NOT_VERIFIED") {
        setPendingOtpEmail(values.email);
        toast.error("Please verify your OTP before logging in.");
        navigate(APP_ROUTES.VERIFY_OTP);
        return;
      }

      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (nextAttempts >= AUTH_LIMITS.LOGIN_MAX_ATTEMPTS_UI) {
        setLockSeconds(AUTH_LIMITS.LOGIN_LOCK_SECONDS_UI);
        toast.error("Too many attempts. Login temporarily locked.");
        return;
      }

      if (status === 401) {
        toast.error("Incorrect email or password.");
        return;
      }

      if (status === 429) {
        toast.error("Rate limit reached. Please wait and retry.");
        return;
      }

      toast.error(message || "Login failed. Please try again.");
    }
  };

  return (
    <>
      <AuthLayout
        title="Welcome back"
        subtitle="Sign in with your verified account to continue securely."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-100">Email</span>
            <input
              type="email"
              {...register("email")}
              className="w-full rounded-xl border border-slate-600 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
            />
            {errors.email ? <p className="mt-1 text-xs text-red-300">{errors.email.message}</p> : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-100">Password</span>
            <input
              type="password"
              {...register("password")}
              className="w-full rounded-xl border border-slate-600 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-red-300">{errors.password.message}</p>
            ) : null}
          </label>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Forgot password (coming soon)</span>
            {isLocked ? <span>Try again in {lockSeconds}s</span> : <span>Secure login only</span>}
          </div>

          <LoadingButton type="submit" loading={isSubmitting} disabled={isLocked}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </LoadingButton>
        </form>

        <p className="mt-5 text-sm text-slate-300">
          New here?{" "}
          <Link to={APP_ROUTES.REGISTER} className="font-medium text-brand-primary hover:underline">
            Create account
          </Link>
        </p>
      </AuthLayout>

      {isSubmitting ? <LoadingOverlay fullScreen label="Securing sign in..." /> : null}
    </>
  );
};

export default LoginPage;

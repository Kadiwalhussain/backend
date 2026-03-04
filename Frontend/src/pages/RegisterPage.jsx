import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, Navigate, useNavigate } from "react-router-dom";

import AuthLayout from "../components/layout/AuthLayout";
import LoadingButton from "../components/ui/LoadingButton";
import PasswordStrengthMeter from "../components/ui/PasswordStrengthMeter";
import { APP_ROUTES } from "../config/routes";
import { useAuth } from "../context/AuthContext";
import { AuthService } from "../services/auth.service";
import { setPendingOtpEmail } from "../utils/auth-flow";
import { registerSchema } from "../utils/validators";

const MotionInput = motion.input;

const RegisterPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  if (isAuthenticated) {
    return <Navigate to={APP_ROUTES.DASHBOARD} replace />;
  }

  const onSubmit = async (values) => {
    try {
      await AuthService.register({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      setPendingOtpEmail(values.email);
      toast.success("OTP sent to your email. Please verify to continue.");
      navigate(APP_ROUTES.VERIFY_OTP, { replace: true });
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;

      if (status === 422) {
        toast.error(message || "Email already exists");
        return;
      }

      if (status === 429) {
        toast.error("Too many requests. Please try again shortly.");
        return;
      }

      toast.error(message || "Registration failed. Please try again.");
    }
  };

  const renderInput = (name, label, type = "text") => (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-100">{label}</span>
      <MotionInput
        whileFocus={{ scale: 1.01 }}
        type={type}
        {...register(name)}
        className="w-full rounded-xl border border-slate-600 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
      />
      {errors[name] ? (
        <p className="mt-1 text-xs text-red-300">{errors[name]?.message}</p>
      ) : null}
    </label>
  );

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Secure onboarding with OTP verification and instant account activation."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {renderInput("name", "Full Name")}
        {renderInput("email", "Email", "email")}
        {renderInput("password", "Password", "password")}
        <PasswordStrengthMeter password={password || ""} />
        {renderInput("confirmPassword", "Confirm Password", "password")}

        <LoadingButton type="submit" loading={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </LoadingButton>
      </form>

      <p className="mt-5 text-sm text-slate-300">
        Already have an account?{" "}
        <Link to={APP_ROUTES.LOGIN} className="font-medium text-brand-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default RegisterPage;

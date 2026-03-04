import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, Navigate, useNavigate } from "react-router-dom";

import AuthLayout from "../components/layout/AuthLayout";
import LoadingButton from "../components/ui/LoadingButton";
import LoadingOverlay from "../components/ui/LoadingOverlay";
import OtpInputGroup from "../components/ui/OtpInputGroup";
import WelcomeBonusModal from "../components/ui/WelcomeBonusModal";
import { AUTH_LIMITS } from "../config/constants";
import { APP_ROUTES } from "../config/routes";
import { useAccount } from "../context/AccountContext";
import { useAuth } from "../context/AuthContext";
import { useCountdown } from "../hooks/useCountdown";
import { AuthService } from "../services/auth.service";
import {
  clearPendingOtpEmail,
  setPendingOtpEmail,
  setWelcomeBonusResult,
  getPendingOtpEmail,
} from "../utils/auth-flow";
import { otpSchema } from "../utils/validators";

const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, refreshUser } = useAuth();
  const { refreshAccount, balance, recentTransactions } = useAccount();

  const [attempts, setAttempts] = useState(0);
  const [otpValue, setOtpValue] = useState("");
  const [bonusData, setBonusData] = useState(null);
  const [bonusOpen, setBonusOpen] = useState(false);

  const pendingEmail = useMemo(() => getPendingOtpEmail(), []);

  const { seconds, running, reset } = useCountdown(AUTH_LIMITS.OTP_RESEND_SECONDS);

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      email: pendingEmail,
      otp: "",
    },
  });

  const locked = attempts >= AUTH_LIMITS.OTP_MAX_ATTEMPTS;

  useEffect(() => {
    setValue("otp", otpValue);
  }, [otpValue, setValue]);

  if (isAuthenticated && !bonusOpen) {
    return <Navigate to={APP_ROUTES.DASHBOARD} replace />;
  }

  const onSubmit = async (values) => {
    if (locked) return;

    try {
      const response = await AuthService.verifyOtp(values);

      await refreshUser();
      await refreshAccount();

      const bonus = response?.bonus || {
        amount: 1000,
        credited: false,
        transactionId: null,
        error: "Welcome bonus is delayed. Please contact support.",
      };

      setBonusData(bonus);
      setWelcomeBonusResult(bonus);
      setBonusOpen(true);
      clearPendingOtpEmail();
      toast.success(response?.alreadyVerified ? "Already verified" : "Verification successful");
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;

      if (status === 400) {
        setAttempts((value) => value + 1);
      }

      if (status === 429) {
        setAttempts(AUTH_LIMITS.OTP_MAX_ATTEMPTS);
      }

      toast.error(message || "OTP verification failed");
    }
  };

  const handleResend = async () => {
    if (running || !pendingEmail) return;

    try {
      await AuthService.resendOtp({ email: pendingEmail });
      setAttempts(0);
      setOtpValue("");
      reset(AUTH_LIMITS.OTP_RESEND_SECONDS);
      toast.success("OTP resent successfully");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not resend OTP");
    }
  };

  const closeBonusModal = () => {
    setBonusOpen(false);
    navigate(APP_ROUTES.DASHBOARD, { replace: true });
  };

  return (
    <>
      <AuthLayout
        title="Verify your account"
        subtitle="Enter the 6-digit OTP sent to your inbox to activate secure banking access."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-100">Email</span>
            <input
              type="email"
              {...register("email")}
              onChange={(event) => {
                register("email").onChange(event);
                setPendingOtpEmail(event.target.value);
              }}
              className="w-full rounded-xl border border-slate-600 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
            />
            {errors.email ? <p className="mt-1 text-xs text-red-300">{errors.email.message}</p> : null}
          </label>

          <div>
            <span className="mb-2 block text-sm font-medium text-slate-100">One-Time Password</span>
            <OtpInputGroup
              value={otpValue}
              onChange={setOtpValue}
              disabled={isSubmitting || locked}
              length={AUTH_LIMITS.OTP_LENGTH}
            />
            {errors.otp ? <p className="mt-1 text-xs text-red-300">{errors.otp.message}</p> : null}
            {locked ? (
              <p className="mt-2 rounded-lg border border-amber-500/40 bg-amber-900/20 px-3 py-2 text-xs text-amber-200">
                Verification locked after 5 failed attempts. Please resend OTP and retry.
              </p>
            ) : null}
          </div>

          <LoadingButton type="submit" loading={isSubmitting} disabled={locked}>
            {isSubmitting ? "Verifying..." : "Verify OTP"}
          </LoadingButton>

          <button
            type="button"
            onClick={handleResend}
            disabled={running}
            className="w-full rounded-xl border border-slate-600 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-brand-primary hover:text-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running ? `Resend OTP in ${seconds}s` : "Resend OTP"}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-300">
          Back to{" "}
          <Link to={APP_ROUTES.LOGIN} className="font-medium text-brand-primary hover:underline">
            Login
          </Link>
        </p>
      </AuthLayout>

      <WelcomeBonusModal
        open={bonusOpen}
        onClose={closeBonusModal}
        transactionId={bonusData?.transactionId || recentTransactions?.[0]?._id}
        balance={balance}
        supportMessage={bonusData?.credited ? null : bonusData?.error}
      />

      {isSubmitting ? <LoadingOverlay fullScreen label="Verifying OTP securely..." /> : null}
    </>
  );
};

export default VerifyOtpPage;

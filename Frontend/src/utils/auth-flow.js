export const OTP_EMAIL_KEY = "pendingOtpEmail";
export const LOGIN_ATTEMPTS_KEY = "loginAttempts";
export const LOGIN_LOCK_UNTIL_KEY = "loginLockUntil";
export const BONUS_RESULT_KEY = "welcomeBonusResult";

export const setPendingOtpEmail = (email) => {
  sessionStorage.setItem(OTP_EMAIL_KEY, email);
};

export const getPendingOtpEmail = () => sessionStorage.getItem(OTP_EMAIL_KEY) || "";

export const clearPendingOtpEmail = () => sessionStorage.removeItem(OTP_EMAIL_KEY);

export const setWelcomeBonusResult = (bonus) => {
  sessionStorage.setItem(BONUS_RESULT_KEY, JSON.stringify(bonus || null));
};

export const getWelcomeBonusResult = () => {
  const raw = sessionStorage.getItem(BONUS_RESULT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearWelcomeBonusResult = () => sessionStorage.removeItem(BONUS_RESULT_KEY);

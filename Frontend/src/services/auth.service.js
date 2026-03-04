import api from "./api";
import { API_ENDPOINTS } from "../config/constants";

const register = async (payload) => {
  const { data } = await api.post(API_ENDPOINTS.AUTH.REGISTER, payload);
  return data;
};

const resendOtp = async (payload) => {
  const { data } = await api.post(API_ENDPOINTS.AUTH.RESEND_OTP, payload);
  return data;
};

const login = async (payload) => {
  const { data } = await api.post(API_ENDPOINTS.AUTH.LOGIN, payload);
  return data;
};

const verifyOtp = async (payload) => {
  const { data } = await api.post(API_ENDPOINTS.AUTH.VERIFY_OTP, payload);
  return data;
};

const logout = async () => {
  const { data } = await api.post(API_ENDPOINTS.AUTH.LOGOUT);
  return data;
};

const getCurrentUser = async () => {
  const { data } = await api.get(API_ENDPOINTS.AUTH.ME);
  return data;
};

export const AuthService = {
  register,
  resendOtp,
  login,
  verifyOtp,
  logout,
  getCurrentUser,
};

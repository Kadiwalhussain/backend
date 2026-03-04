import api from "./api";
import { API_ENDPOINTS } from "../config/constants";

const getAccount = async () => {
  const { data } = await api.get(API_ENDPOINTS.ACCOUNT.ME);
  return data;
};

const getBalance = async () => {
  const { data } = await api.get(API_ENDPOINTS.ACCOUNT.BALANCE);
  return data;
};

const getRecentTransactions = async (limit = 5) => {
  const { data } = await api.get(API_ENDPOINTS.TRANSACTION.RECENT, {
    params: { limit },
  });
  return data;
};

const lookupReceiver = async (query) => {
  const { data } = await api.get(API_ENDPOINTS.ACCOUNT.LOOKUP, {
    params: { query },
  });
  return data;
};

export const AccountService = {
  getAccount,
  getBalance,
  getRecentTransactions,
  lookupReceiver,
};

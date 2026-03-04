import { v4 as uuidv4 } from "uuid";
import api from "./api";
import { API_ENDPOINTS } from "../config/constants";

const createTransfer = async (payload) => {
  const body = {
    ...payload,
    idempotencyKey: payload?.idempotencyKey || uuidv4(),
  };

  const { data } = await api.post(API_ENDPOINTS.TRANSACTION.TRANSFER, body);
  return data;
};

const getTransactionHistory = async (params = {}) => {
  const { data } = await api.get(API_ENDPOINTS.TRANSACTION.HISTORY, {
    params,
  });
  return data;
};

const getTransactionDetail = async (transactionId) => {
  const { data } = await api.get(`${API_ENDPOINTS.TRANSACTION.DETAIL}/${transactionId}`);
  return data;
};

export const TransactionService = {
  createTransfer,
  getTransactionHistory,
  getTransactionDetail,
};

export const PENDING_TRANSFER_KEY = "pendingTransferPayload";

export const savePendingTransfer = (payload) => {
  sessionStorage.setItem(PENDING_TRANSFER_KEY, JSON.stringify(payload));
};

export const getPendingTransfer = () => {
  const raw = sessionStorage.getItem(PENDING_TRANSFER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearPendingTransfer = () => {
  sessionStorage.removeItem(PENDING_TRANSFER_KEY);
};

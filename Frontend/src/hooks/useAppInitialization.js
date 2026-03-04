import { useAuth } from "../context/AuthContext";
import { useAccount } from "../context/AccountContext";

export const useAppInitialization = () => {
  const auth = useAuth();
  const account = useAccount();

  const loading = auth.loading || (auth.isAuthenticated && account.loading);

  return {
    loading,
    isAuthenticated: auth.isAuthenticated,
  };
};

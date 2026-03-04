import { useAppInitialization } from "../../hooks/useAppInitialization";
import LoadingOverlay from "../ui/LoadingOverlay";

const AppBootstrapGate = ({ children }) => {
  const { loading } = useAppInitialization();

  if (loading) {
    return <LoadingOverlay fullScreen label="Initializing secure banking session..." />;
  }

  return children;
};

export default AppBootstrapGate;

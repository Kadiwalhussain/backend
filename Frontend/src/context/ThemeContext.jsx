import { createContext, useContext, useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "banking_theme_mode";
const CONTRAST_STORAGE_KEY = "banking_contrast_mode";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) !== "light");
  const [highContrast, setHighContrast] = useState(
    () => localStorage.getItem(CONTRAST_STORAGE_KEY) === "true"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
    localStorage.setItem(CONTRAST_STORAGE_KEY, String(highContrast));
  }, [highContrast]);

  const value = useMemo(
    () => ({
      isDark,
      highContrast,
      toggleTheme: () => setIsDark((value) => !value),
      toggleContrast: () => setHighContrast((value) => !value),
    }),
    [highContrast, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
};

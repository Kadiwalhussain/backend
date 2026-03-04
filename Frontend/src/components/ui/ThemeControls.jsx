import { useTheme } from "../../context/ThemeContext";

const ThemeControls = () => {
  const { isDark, highContrast, toggleTheme, toggleContrast } = useTheme();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex gap-2">
      <button
        type="button"
        aria-label="Toggle dark mode"
        onClick={toggleTheme}
        className="rounded-full border border-slate-600 bg-slate-900/90 px-3 py-2 text-xs font-semibold text-slate-100 backdrop-blur hover:border-brand-primary"
      >
        {isDark ? "Light" : "Dark"}
      </button>
      <button
        type="button"
        aria-label="Toggle high contrast mode"
        onClick={toggleContrast}
        className="rounded-full border border-slate-600 bg-slate-900/90 px-3 py-2 text-xs font-semibold text-slate-100 backdrop-blur hover:border-brand-primary"
      >
        {highContrast ? "Std" : "HC"}
      </button>
    </div>
  );
};

export default ThemeControls;

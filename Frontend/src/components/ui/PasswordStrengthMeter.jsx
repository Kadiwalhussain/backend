import { motion } from "framer-motion";

const MotionBar = motion.div;

const checks = [
  { key: "length", label: "8+ characters", test: (value) => value.length >= 8 },
  { key: "upper", label: "Uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { key: "number", label: "Number", test: (value) => /[0-9]/.test(value) },
  {
    key: "special",
    label: "Special character",
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
];

const PasswordStrengthMeter = ({ password = "" }) => {
  const passed = checks.filter((item) => item.test(password)).length;
  const progress = (passed / checks.length) * 100;

  return (
    <div className="mt-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <MotionBar
          className="h-full rounded-full bg-brand-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.25 }}
        />
      </div>
      <ul className="mt-2 grid gap-1 text-xs text-slate-300">
        {checks.map((item) => {
          const ok = item.test(password);
          return (
            <li key={item.key} className="flex items-center gap-2">
              <span className={`inline-block size-2 rounded-full ${ok ? "bg-brand-primary" : "bg-slate-600"}`} />
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordStrengthMeter;

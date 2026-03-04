import { useMemo, useRef } from "react";

const OtpInputGroup = ({ value, onChange, disabled = false, length = 6 }) => {
  const refs = useRef([]);
  const digits = useMemo(() => {
    const base = Array.from({ length }, () => "");
    value.split("").forEach((char, index) => {
      if (index < length) base[index] = char;
    });
    return base;
  }, [length, value]);

  const setDigit = (index, char) => {
    const next = [...digits];
    next[index] = char;
    onChange(next.join(""));
  };

  const focusAt = (index) => {
    if (refs.current[index]) refs.current[index].focus();
  };

  const handleChange = (index, event) => {
    const raw = event.target.value.replace(/\D/g, "");
    const char = raw.slice(-1);

    setDigit(index, char);
    if (char && index < length - 1) focusAt(index + 1);
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      focusAt(index - 1);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted);

    const focusIndex = Math.min(pasted.length, length - 1);
    focusAt(focusIndex);
  };

  return (
    <div className="flex justify-between gap-2" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onChange={(event) => handleChange(index, event)}
          className="h-12 w-12 rounded-xl border border-slate-600 bg-slate-900/60 text-center text-lg font-semibold text-white outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
        />
      ))}
    </div>
  );
};

export default OtpInputGroup;

import { useEffect, useState } from "react";

export const useCountdown = (initialSeconds = 60) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;

    const timer = setInterval(() => {
      setSeconds((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  const reset = (newSeconds = initialSeconds) => setSeconds(newSeconds);

  return {
    seconds,
    reset,
    running: seconds > 0,
  };
};

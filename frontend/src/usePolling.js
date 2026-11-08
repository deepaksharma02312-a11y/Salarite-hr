import { useCallback, useEffect, useRef, useState } from "react";

// Har `ms` milliseconds me fn dobara chalata hai -> employer ko live data dikhta hai.
// enabled=false karne pe auto-refresh ruk jaata hai (Live menu ka "Pause").
export function usePolling(fn, ms = 3000, enabled = true) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const reload = useCallback(async () => {
    try {
      setData(await fnRef.current());
      setError("");
      setUpdatedAt(Date.now());
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    reload();
    const id = setInterval(reload, ms);
    return () => clearInterval(id);
  }, [reload, ms, enabled]);

  return { data, error, updatedAt, reload };
}

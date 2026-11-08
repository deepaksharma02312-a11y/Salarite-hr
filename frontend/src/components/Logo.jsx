import { useState } from "react";

/**
 * Salarite logo.
 * Apna asli logo dikhane ke liye file ko `frontend/public/logo.png` naam se rakh do.
 * Agar file nahi mili to neeche wala default "S" mark apne aap dikhta hai.
 * Agar tumhare logo me "Salarite" naam pehle se likha hai to showText={false} kar do.
 */
export default function Logo({ size = 38, light = false, showText = true }) {
  const [useImage, setUseImage] = useState(true);

  return (
    <span className={`logo ${light ? "light" : ""}`}>
      {useImage ? (
        <img src="/logo.png" alt={showText ? "" : "Salarite"} height={size} style={{ height: size, width: "auto" }} onError={() => setUseImage(false)} />
      ) : (
        <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label={showText ? undefined : "Salarite"}>
          <rect width="40" height="40" rx="11" fill={light ? "#ffffff" : "#1558d6"} />
          <path d="M26.5 14.2c-1.4-1.5-3.4-2.3-5.9-2.3-3.4 0-5.7 1.7-5.7 4.3 0 2.4 1.7 3.5 5.2 4.4 2.3.6 3 1 3 1.9 0 .9-.9 1.5-2.4 1.5-1.7 0-3.1-.7-4.1-1.9l-2.4 2.6c1.5 1.7 3.8 2.8 6.6 2.8 3.7 0 6.1-1.8 6.1-4.6 0-2.5-1.6-3.6-5.2-4.5-2.2-.6-3-.9-3-1.8 0-.8.8-1.3 2.1-1.3 1.3 0 2.4.5 3.3 1.5z" fill={light ? "#1558d6" : "#ffffff"} />
        </svg>
      )}
      {showText && <span className="logo-text">Salarite</span>}
    </span>
  );
}

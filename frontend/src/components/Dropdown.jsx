import { useEffect, useRef, useState } from "react";

/**
 * Chhota reusable dropdown. Button dabane pe panel khulta hai,
 * bahar click karne ya Esc dabane pe band ho jaata hai.
 * children ek function bhi ho sakta hai: (close) => ...
 */
export default function Dropdown({ label, trigger, className = "", onOpen, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    if (!open && onOpen) onOpen();
    setOpen(!open);
  }

  const close = () => setOpen(false);

  return (
    <div className="dd" ref={ref}>
      <button type="button" className={className} aria-label={label} aria-haspopup="true" aria-expanded={open} onClick={toggle}>
        {trigger}
      </button>
      {open && <div className="dd-panel">{typeof children === "function" ? children(close) : children}</div>}
    </div>
  );
}

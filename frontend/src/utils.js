// Backend naive UTC datetime bhejta hai (bina "Z"), isliye "Z" jodkar parse karte hain.
export const toDate = (iso) => new Date(iso.endsWith("Z") ? iso : iso + "Z");

export function timeAgo(iso) {
  const sec = Math.max(0, (Date.now() - toDate(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`;
  return `${Math.floor(sec / 86400)} d ago`;
}

export function formatWhen(iso) {
  return toDate(iso).toLocaleString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

// Milliseconds timestamp (Date.now()) ko "5s ago" jaisa dikhata hai
export function agoMs(ms) {
  const sec = Math.max(0, (Date.now() - ms) / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${Math.floor(sec)}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  return `${Math.floor(sec / 3600)} hr ago`;
}

// "Tue, 11 Nov, 11:00 – 11:30" (end time na ho to sirf start dikhata hai)
export function formatRange(startIso, endIso) {
  const start = toDate(startIso);
  const day = start.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
  const time = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (!endIso) return `${day}, ${time(start)}`;
  return `${day}, ${time(start)} \u2013 ${time(toDate(endIso))}`;
}

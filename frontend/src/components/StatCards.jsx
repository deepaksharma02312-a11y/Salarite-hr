import { CheckIcon, ClipboardIcon, ClockIcon, FileIcon } from "./Icons.jsx";

const ITEMS = [
  { key: "all", label: "Total tasks", icon: <ClipboardIcon /> },
  { key: "pending", label: "Pending", icon: <FileIcon /> },
  { key: "in_progress", label: "In progress", icon: <ClockIcon /> },
  { key: "completed", label: "Completed", icon: <CheckIcon /> },
];

// Card pe click karne se board us status ke hisaab se filter ho jaata hai.
export default function StatCards({ counts, filter, onSelect }) {
  return (
    <div className="stats" role="group" aria-label="Filter tasks by status">
      {ITEMS.map((it) => (
        <button
          key={it.key}
          type="button"
          className={`stat ${filter === it.key ? "active" : ""}`}
          aria-pressed={filter === it.key}
          onClick={() => onSelect(it.key)}
        >
          <span className="stat-icon">{it.icon}</span>
          <span>
            <span className="stat-label">{it.label}</span>
            <strong>{counts[it.key]}</strong>
          </span>
        </button>
      ))}
    </div>
  );
}

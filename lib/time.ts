// Small deterministic time/date formatting helpers that avoid locale/timezone differences.

// Formats an "HH:MM" or "HH:MM:SS" string to "h:MM AM/PM" without using Date APIs.
export function formatTime12(input?: string): string {
  if (!input) return "";
  const m = String(input).trim().match(/^([0-1]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
  if (!m) return String(input);
  let hours = parseInt(m[1], 10);
  const minutes = m[2];
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${ampm}`;
}

// Formats a "YYYY-MM-DD" string to "Mon D, YYYY" deterministically.
export function formatDateShort(input?: string): string {
  if (!input) return "";
  const m = String(input).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(input);
  const [_, y, mm, dd] = m;
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const monthIdx = Math.max(0, Math.min(11, parseInt(mm, 10) - 1));
  const day = String(parseInt(dd, 10));
  return `${monthNames[monthIdx]} ${day}, ${y}`;
}


const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Format a YYYY-MM-DD or ISO timestamp without reading the current time. */
export function formatDate(iso: string): string {
  const day = iso.slice(0, 10);
  const [year, month, date] = day.split("-");
  const monthName = MONTHS[Number(month) - 1];
  if (!year || !monthName || !date) return day;
  return `${monthName} ${Number(date)}, ${year}`;
}

export function matchesQuery(haystack: string, query: string): boolean {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const hay = haystack.toLowerCase();
  return terms.every((term) => hay.includes(term));
}

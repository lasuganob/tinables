const APP_TIME_ZONE = "Asia/Manila";

function getTimeZoneParts(date, options = {}) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...options
  }).formatToParts(date);
}

function getPartValue(parts, type) {
  return parts.find((part) => part.type === type)?.value || "";
}

export function getTodayInAppTimeZone() {
  const parts = getTimeZoneParts(new Date());
  return `${getPartValue(parts, "year")}-${getPartValue(parts, "month")}-${getPartValue(parts, "day")}`;
}

export function getCurrentMonthInAppTimeZone() {
  return getTodayInAppTimeZone().slice(0, 7);
}

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

export function formatDateKey(value) {
  const parsedDate = value instanceof Date ? value : parseDateValue(value);

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return [
    parsedDate.getFullYear(),
    padDatePart(parsedDate.getMonth() + 1),
    padDatePart(parsedDate.getDate())
  ].join("-");
}

export function getWeekStart(value) {
  const parsedDate = value instanceof Date ? value : parseDateValue(value);

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const weekStart = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
  const dayOfWeek = weekStart.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  weekStart.setDate(weekStart.getDate() - daysFromMonday);

  return weekStart;
}

export function getWeekStartValue(value) {
  const weekStart = getWeekStart(value);
  return weekStart ? formatDateKey(weekStart) : "";
}

export function getWeekEndValue(value) {
  const weekStart = getWeekStart(value);

  if (!weekStart) {
    return "";
  }

  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
  weekEnd.setDate(weekEnd.getDate() + 6);
  return formatDateKey(weekEnd);
}

export function getCurrentWeekStartInAppTimeZone() {
  return getWeekStartValue(getTodayInAppTimeZone());
}

export function isDateWithinWeek(dateValue, weekStartValue) {
  if (!weekStartValue) {
    return true;
  }

  const normalizedDate = formatDateKey(dateValue);
  const normalizedWeekStart = getWeekStartValue(weekStartValue);
  const normalizedWeekEnd = getWeekEndValue(weekStartValue);

  if (!normalizedDate || !normalizedWeekStart || !normalizedWeekEnd) {
    return false;
  }

  return normalizedDate >= normalizedWeekStart && normalizedDate <= normalizedWeekEnd;
}

export function parseDateValue(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(value);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) {
    return "";
  }

  const parsedDate = parseDateValue(value);

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parsedDate);
}

export function formatMonthDay(value) {
  if (!value) {
    return "";
  }

  const parsedDate = parseDateValue(value);

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    month: "short",
    day: "numeric"
  }).format(parsedDate);
}

export function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

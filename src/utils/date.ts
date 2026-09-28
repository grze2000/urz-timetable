// UTC is used only for calendar arithmetic on date-only strings.
export const addDays = (date: string, days: number) => {
  const result = new Date(`${date}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
};
export const todayInWarsaw = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
export const weekStart = (date: string) =>
  addDays(date, -((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7));

export const isDate = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;

export const isWithinTeachingPeriod = (date: string) => {
  const monthAndDay = date.slice(5);
  return monthAndDay >= "10-01" || monthAndDay <= "06-30";
};

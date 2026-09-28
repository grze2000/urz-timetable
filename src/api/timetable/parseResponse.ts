export const isTime = (value: unknown): value is string =>
  typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export const expectObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Nieprawidłowa odpowiedź API Mentor.");
  }
  return value as Record<string, unknown>;
};

export const expectValid: (condition: unknown) => asserts condition = (
  condition,
) => {
  if (!condition) throw new Error("Nieprawidłowa odpowiedź API Mentor.");
};

export const displayText = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : "—";

export const relationText = (value: unknown, key: string) =>
  value == null ? "—" : displayText(expectObject(value)[key]);

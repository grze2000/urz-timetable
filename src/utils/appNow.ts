import { DEV_NOW } from "../config/development.ts";

export function appNow(
  now = new Date(),
  environment = process.env.NODE_ENV,
  override = DEV_NOW,
) {
  if (environment === "development" && override) {
    const fixed = new Date(override);
    if (Number.isFinite(fixed.getTime())) return fixed;
  }
  return now;
}

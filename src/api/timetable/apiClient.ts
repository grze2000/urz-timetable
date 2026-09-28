import axios from "axios";

const configuredHost = process.env.NEXT_PUBLIC_API_URL?.trim();

if (!configuredHost) {
  throw new Error("Brak wymaganej zmiennej NEXT_PUBLIC_API_URL.");
}

export const apiHost = configuredHost.replace(/\/+$/, "");

export const apiClient = axios.create({
  baseURL: `${apiHost}/api/student-schedule`,
  timeout: 15_000,
  withCredentials: false,
});

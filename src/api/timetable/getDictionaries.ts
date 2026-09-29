"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, apiHost } from "./apiClient";
import { parseDictionaries } from "./parseDictionaries";

export const getDictionaries = async (signal?: AbortSignal) =>
  parseDictionaries((await apiClient.get("/dictionaries", { signal })).data);

export const useDictionaries = (enabled = true) =>
  useQuery({
    queryKey: ["mentor", apiHost, "dictionaries"],
    queryFn: ({ signal }) => getDictionaries(signal),
    staleTime: 30 * 60_000,
    retry: 1,
    enabled,
  });

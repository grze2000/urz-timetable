import { siteUrl } from "@/config/siteUrl";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/day", "/timetable"].map((path) => ({
    url: new URL(path, siteUrl).toString(),
  }));
}

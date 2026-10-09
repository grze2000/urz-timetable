import { appConfig } from "@/config/appConfig";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { version: appConfig.version },
    { headers: { "Cache-Control": "no-store" } },
  );
}

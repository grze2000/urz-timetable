import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export function createBrandIcon(size: number) {
  const logo = readFileSync(path.join(process.cwd(), "public/urz-logo.png"));
  const logoUrl = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        backgroundColor: "#4D88FC",
      }}
    >
      <img src={logoUrl} width={size} height={size} alt="" />
    </div>,
    { width: size, height: size },
  );
}

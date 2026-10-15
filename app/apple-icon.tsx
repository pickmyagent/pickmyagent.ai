import { ImageResponse } from "next/og";
import { RobotFace } from "@/components/robot-face";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<RobotFace size={180} />, { ...size });
}

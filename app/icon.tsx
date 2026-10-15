import { ImageResponse } from "next/og";
import { RobotFace } from "@/components/robot-face";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<RobotFace size={32} />, { ...size });
}

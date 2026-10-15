import { useId } from "react";

type RobotMarkProps = {
  className?: string;
  title?: string;
};

/**
 * Bold robot head. Designed to stay recognizable from 16px to 32px:
 * a large rounded head, two block eyes, and a short antenna.
 */
export function RobotMark({ className, title }: RobotMarkProps) {
  const labelled = Boolean(title);
  const gradientId = `pma-robot-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role={labelled ? "img" : undefined}
      aria-hidden={labelled ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="4"
          y1="2"
          x2="28"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#f7e8bc" />
          <stop offset="42%" stopColor="#e8c56a" />
          <stop offset="100%" stopColor="#c4922a" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="3.2" r="2.15" fill={`url(#${gradientId})`} />
      <rect x="14.85" y="4.7" width="2.3" height="4.4" rx="1" fill={`url(#${gradientId})`} />
      <rect x="3" y="9" width="26" height="20" rx="7" fill={`url(#${gradientId})`} />
      <rect x="8.2" y="14.6" width="6.2" height="6.4" rx="1.7" fill="#07090f" />
      <rect x="17.6" y="14.6" width="6.2" height="6.4" rx="1.7" fill="#07090f" />
    </svg>
  );
}

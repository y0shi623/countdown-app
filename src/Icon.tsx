export function TimerClockIcon({
  strokeWidth = 2,
  iconSize = 24,
}: {
  strokeWidth?: number | string;
  iconSize?: number | string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      width={iconSize}
      height={iconSize}
    >
      <path
        d="
          M18.36 5.64
          A9 9 0 1 1 5.64 18.36
        "
        stroke="#24C8A6"
        strokeWidth={strokeWidth}
        stroke-linecap="round"
      />
      <path
        d="
          M5.64 18.36
          A9 9 0 1 1 18.36 5.64
        "
        stroke="#F5C542"
        strokeWidth={strokeWidth}
        stroke-linecap="round"
      />

      <line
        x1="12"
        y1="12"
        x2="12"
        y2="6"
        stroke="#24C8A6"
        strokeWidth={strokeWidth}
        stroke-linecap="round"
      />

      <line
        x1="12"
        y1="12"
        x2="16"
        y2="14"
        stroke="#F5C542"
        strokeWidth={strokeWidth}
        stroke-linecap="round"
      />

      <circle
        cx="12"
        cy="12"
        r="1.5"
        fill="#24C8A6"
      />
    </svg>
  )
}
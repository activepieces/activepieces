interface Props {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export const CircularIcon: React.FC<Props> = ({
  value,
  size = 50,
  strokeWidth = 3.5,
  label,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      {/* Progress Circle */}
      <svg width={size} height={size} className="inline-block">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          className="text-gray-200 dark:text-gray-700"
          fill="transparent"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          className="text-primary"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {/* Percentage Label */}
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={size * 0.225}
          fontWeight="bold"
          className="fill-current text-gray-700 dark:text-gray-200"
        >
          {value.toFixed(1)}%
        </text>
      </svg>

      {/* Label */}
      {label && (
        <div className="text-sm text-gray-700 dark:text-gray-400">{label}</div>
      )}
    </div>
  );
};

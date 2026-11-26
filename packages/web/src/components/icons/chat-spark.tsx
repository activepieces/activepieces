import type { SVGProps } from 'react';

export function ChatSparkIcon({
  strokeWidth = 2,
  spark = true,
  sparkClassName,
  ...props
}: SVGProps<SVGSVGElement> & { spark?: boolean; sparkClassName?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d={chatSparkPaths.bubble} />
      {spark && <path d={chatSparkPaths.spark} className={sparkClassName} />}
      {chatSparkPaths.lines.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

const chatSparkPaths = {
  bubble:
    'M14 3.5H7A4.5 4.5 0 0 0 2.5 8v7A4.5 4.5 0 0 0 7 19.5v1.8c0 .6.7.96 1.2.6l3.3-2.4H17a4.5 4.5 0 0 0 4.5-4.5v-4.5',
  spark:
    'M19 2Q19.58 4.32 21.9 4.9Q19.58 5.48 19 7.8Q18.42 5.48 16.1 4.9Q18.42 4.32 19 2Z',
  lines: ['M7 9.5H14.5', 'M7 13.5H17.5'],
} as const;

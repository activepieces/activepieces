import { cn } from '@/lib/utils';

export const McpSvg = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    fill="none"
    className={cn('w-6 h-6 transition-all duration-150 ease-in-out', className)}
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="4.312"
      d="M6.288 30.06 30.68 5.669a8.624 8.624 0 0 1 12.196 0v0a8.624 8.624 0 0 1 0 12.197l-18.42 18.421"
    ></path>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="4.312"
      d="m24.71 36.032 18.166-18.167a8.624 8.624 0 0 1 12.197 0l.127.127a8.624 8.624 0 0 1 0 12.196l-22.061 22.06a2.874 2.874 0 0 0 0 4.066l4.53 4.53"
    ></path>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="4.312"
      d="m36.778 11.766-18.04 18.04a8.624 8.624 0 0 0 0 12.197v0a8.624 8.624 0 0 0 12.196 0l18.04-18.04"
    ></path>
  </svg>
);

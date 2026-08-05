import { PROJECT_COLOR_PALETTE } from '@activepieces/shared';

import { cn } from '@/lib/utils';

import { MockProjectAiUsage } from '../mock/fixtures';

export function ProjectIconTile({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const palette = Object.values(PROJECT_COLOR_PALETTE);
  const color =
    palette[
      [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0) %
        palette.length
    ];
  return (
    <span
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-medium',
        className,
      )}
      style={{ backgroundColor: color.color, color: color.textColor }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function usageMath({ row }: { row: MockProjectAiUsage }): {
  ratio: number;
  reached: boolean;
} {
  const ratio = row.limit === null ? 0 : row.creditsUsed / row.limit;
  return { ratio, reached: row.limit !== null && ratio >= 1 };
}

import { FlowCreator, FlowCreatorType } from '@activepieces/shared';
import { t } from 'i18next';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type FlowCreatedByBadgeProps = {
  createdBy: FlowCreator | null | undefined;
  className?: string;
};

export const FlowCreatedByBadge = ({
  createdBy,
  className,
}: FlowCreatedByBadgeProps) => {
  if (!createdBy || createdBy.type !== FlowCreatorType.MCP) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex h-5 items-center gap-1 rounded-md border border-border bg-muted px-[5px] text-xs font-bold leading-none text-muted-foreground',
            className,
          )}
        >
          <McpKnotIcon />
          {t('AI')}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{t('Created by AI MCP')}</TooltipContent>
    </Tooltip>
  );
};

const McpKnotIcon = () => (
  <svg
    width="10"
    height="11"
    viewBox="5 4.5 10 11"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5.49976 9.70973L9.7676 5.44206C10.0506 5.15909 10.4344 5.00012 10.8346 5.00012C11.2347 5.00012 11.6185 5.15909 11.9015 5.44206C12.0417 5.58218 12.1528 5.74853 12.2287 5.93162C12.3045 6.11471 12.3435 6.31094 12.3435 6.50911C12.3435 6.70728 12.3045 6.90352 12.2287 7.0866C12.1528 7.26969 12.0417 7.43604 11.9015 7.57616M11.9015 7.57616L8.67859 10.7993M11.9015 7.57616L8.72306 10.7546M11.9015 7.57616C12.0416 7.43602 12.208 7.32466 12.3911 7.24882C12.5742 7.17297 12.7704 7.13394 12.9686 7.13394C13.1668 7.13394 13.363 7.17297 13.5461 7.24882C13.7292 7.32466 13.8955 7.43582 14.0356 7.57596L14.0579 7.59818C14.3408 7.88116 14.4998 8.26496 14.4998 8.66515C14.4998 9.06533 14.3408 9.44913 14.0579 9.73211L10.1979 13.5919C10.1511 13.6386 10.1141 13.6941 10.0888 13.7551C10.0635 13.8161 10.0505 13.8816 10.0505 13.9476C10.0505 14.0137 10.0635 14.0791 10.0888 14.1402C10.1141 14.2012 10.1511 14.2566 10.1979 14.3033L10.9905 15.096M10.8346 6.50886L7.6782 9.6653C7.53806 9.80542 7.42689 9.97177 7.35105 10.1549C7.2752 10.3379 7.23617 10.5342 7.23617 10.7323C7.23617 10.9305 7.2752 11.1268 7.35105 11.3098C7.42689 11.4929 7.53806 11.6593 7.6782 11.7994C7.96117 12.0824 8.34497 12.2413 8.74516 12.2413C9.14534 12.2413 9.52914 12.0824 9.81212 11.7994L12.9686 8.64295" />
  </svg>
);

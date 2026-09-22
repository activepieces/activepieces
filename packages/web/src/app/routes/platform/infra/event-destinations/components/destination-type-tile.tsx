import { DestinationType } from '@activepieces/shared';
import { Braces } from 'lucide-react';

import { cn } from '@/lib/utils';

export const DestinationTypeTile = ({
  type,
  className,
}: {
  type: DestinationType;
  className?: string;
}) => {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
        TILE_COLORS[type] ?? TILE_COLORS[DestinationType.CUSTOM],
        className,
      )}
    >
      {type === DestinationType.CUSTOM ? (
        <Braces className="size-4" />
      ) : (
        type.charAt(0)
      )}
    </span>
  );
};

const TILE_COLORS: Record<DestinationType, string> = {
  [DestinationType.CUSTOM]: 'bg-primary/10 text-primary',
  [DestinationType.LOKI]:
    'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  [DestinationType.DATADOG]:
    'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  [DestinationType.POSTHOG]:
    'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300',
  [DestinationType.SPLUNK]:
    'bg-green-500/15 text-green-700 dark:text-green-300',
  [DestinationType.ELASTICSEARCH]:
    'bg-teal-500/15 text-teal-700 dark:text-teal-300',
  [DestinationType.SUMO_LOGIC]:
    'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  [DestinationType.NEW_RELIC]:
    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  [DestinationType.AXIOM]:
    'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
  [DestinationType.BETTER_STACK]:
    'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300',
};

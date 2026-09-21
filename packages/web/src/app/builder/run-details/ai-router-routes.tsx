import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { z } from 'zod';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const VISIBLE_ROUTES = 4;

export const AiRouterRoutes = ({ output }: AiRouterRoutesProps) => {
  const ranked = rankRoutes(output);
  if (isNil(ranked)) {
    return null;
  }
  const shown = ranked.slice(0, VISIBLE_ROUTES);
  const hidden = ranked.length - shown.length;

  return (
    <div className="flex flex-col gap-2 p-3 rounded-md border">
      <span className="text-xs text-muted-foreground">
        {t('How sure the model was')}
      </span>
      {shown.map((route) => (
        <div key={route.name} className="flex items-center gap-3">
          <TextWithTooltip tooltipMessage={route.name}>
            <span
              className={cn('text-sm w-32 shrink-0 truncate block', {
                'font-medium text-primary': route.chosen,
                'text-muted-foreground': !route.chosen,
              })}
            >
              {route.name}
            </span>
          </TextWithTooltip>
          <Progress
            value={route.percent}
            className="h-1.5 grow"
            indicatorClassName={cn({ 'bg-muted-foreground': !route.chosen })}
          />
          <span
            className={cn('text-xs w-10 shrink-0 text-right tabular-nums', {
              'text-primary': route.chosen,
              'text-muted-foreground': !route.chosen,
            })}
          >
            {route.percent}%
          </span>
        </div>
      ))}
      {hidden > 0 && (
        <span className="text-xs text-muted-foreground">
          {t('and {count} more', { count: hidden })}
        </span>
      )}
    </div>
  );
};

const AiRouterOutput = z.object({
  choice: z.string(),
  probabilities: z.record(z.string(), z.unknown()).optional(),
});

function rankRoutes(output: unknown): RankedRoute[] | undefined {
  const parsed = AiRouterOutput.safeParse(output);
  if (!parsed.success || isNil(parsed.data.probabilities)) {
    return undefined;
  }
  const { choice, probabilities } = parsed.data;
  const ranked = Object.entries(probabilities)
    .flatMap(([name, probability]) =>
      typeof probability === 'number'
        ? [
            {
              name,
              percent: Math.round(probability * 100),
              chosen: name === choice,
            },
          ]
        : [],
    )
    .sort((a, b) => b.percent - a.percent);
  return ranked.length === 0 ? undefined : ranked;
}

export const aiRouterRoutesUtils = { rankRoutes };

type RankedRoute = {
  name: string;
  percent: number;
  chosen: boolean;
};

type AiRouterRoutesProps = {
  output: unknown;
};

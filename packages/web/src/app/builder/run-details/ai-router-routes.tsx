import { isNil } from '@activepieces/core-utils';
import { AiRouterMatchMode } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Info } from 'lucide-react';
import { z } from 'zod';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const VISIBLE_ROUTES = 5;

export const AiRouterRoutes = ({ output, input }: AiRouterRoutesProps) => {
  const ranked = rankRoutes(output);
  if (isNil(ranked)) {
    return null;
  }
  const shown = ranked.slice(0, VISIBLE_ROUTES);
  const hidden = ranked.length - shown.length;
  const floor = floorExplanation({ input, ranked });

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border">
      <span className="text-xs font-medium text-muted-foreground">
        {t('How sure the model was')}
      </span>
      {shown.map((route) => (
        <div key={route.name} className="flex items-center gap-2">
          <span className="flex size-4 shrink-0 items-center justify-center">
            {route.chosen && <Check className="size-3.5 text-primary" />}
          </span>
          <TextWithTooltip tooltipMessage={route.name}>
            <span
              className={cn('text-sm w-28 shrink-0 truncate block', {
                'font-medium text-primary': route.chosen,
                'text-muted-foreground': !route.chosen,
              })}
            >
              {route.name}
            </span>
          </TextWithTooltip>
          <Progress
            value={route.percent ?? 0}
            className={cn('h-1.5 grow', { 'bg-muted': !route.chosen })}
            indicatorClassName={cn({
              'bg-muted-foreground/50': !route.chosen,
            })}
          />
          <span
            className={cn('text-xs w-10 shrink-0 text-right tabular-nums', {
              'font-medium text-primary': route.chosen,
              'text-muted-foreground': !route.chosen,
            })}
          >
            {isNil(route.percent) ? '—' : `${route.percent}%`}
          </span>
        </div>
      ))}
      {hidden > 0 && (
        <span className="text-xs text-muted-foreground">
          {t('and {count} more', { count: hidden })}
        </span>
      )}
      {!isNil(floor) && (
        <div className="flex items-start gap-2 border-t pt-2 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0 mt-0.5" />
          <span>
            {t(
              '{route} scored {percent}%, under your {floor}% floor, so {fallback} ran',
              floor,
            )}
          </span>
        </div>
      )}
    </div>
  );
};

const AiRouterOutput = z.object({
  branches: z.array(
    z.object({ branchName: z.string(), evaluation: z.boolean() }),
  ),
  probabilities: z.record(z.string(), z.unknown()).optional(),
});

function rankRoutes(output: unknown): RankedRoute[] | undefined {
  const parsed = AiRouterOutput.safeParse(output);
  if (!parsed.success) {
    return undefined;
  }
  const { branches, probabilities } = parsed.data;
  if (isNil(probabilities)) {
    return undefined;
  }
  const ranked = branches.map((branch) => {
    const probability = probabilities[branch.branchName];
    return {
      name: branch.branchName,
      percent:
        typeof probability === 'number'
          ? Math.round(probability * 100)
          : undefined,
      chosen: branch.evaluation,
    };
  });
  if (ranked.every((route) => isNil(route.percent))) {
    return undefined;
  }
  return ranked.sort((a, b) => (b.percent ?? -1) - (a.percent ?? -1));
}

const AiRouterInput = z.object({
  minConfidence: z.number().optional(),
  matchMode: z.enum(AiRouterMatchMode).optional(),
});

function floorExplanation({
  input,
  ranked,
}: {
  input: unknown;
  ranked: RankedRoute[];
}): FloorExplanation | undefined {
  const parsed = AiRouterInput.safeParse(input);
  if (!parsed.success || isNil(parsed.data.minConfidence)) {
    return undefined;
  }
  if (parsed.data.matchMode === AiRouterMatchMode.ALL_MATCHES) {
    return undefined;
  }
  const top = ranked[0];
  const chosen = ranked.find((route) => route.chosen);
  const floor = Math.round(parsed.data.minConfidence * 100);
  if (
    isNil(top) ||
    isNil(chosen) ||
    isNil(top.percent) ||
    top.name === chosen.name ||
    top.percent >= floor
  ) {
    return undefined;
  }
  return {
    route: top.name,
    percent: top.percent,
    floor,
    fallback: chosen.name,
  };
}

export const aiRouterRoutesUtils = { rankRoutes, floorExplanation };

type RankedRoute = {
  name: string;
  percent: number | undefined;
  chosen: boolean;
};

type FloorExplanation = {
  route: string;
  percent: number;
  floor: number;
  fallback: string;
};

type AiRouterRoutesProps = {
  output: unknown;
  input?: unknown;
};

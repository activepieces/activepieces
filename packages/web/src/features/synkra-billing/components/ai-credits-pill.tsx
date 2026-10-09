import { t } from 'i18next';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { synkraBillingHooks } from '../hooks';

/**
 * AI credits pill — shows "142 / 1,000" next to the chat header.
 * Turns red when nearly exhausted. Links to billing when exhausted.
 */
export function AiCreditsPill() {
  const { data: balance } = synkraBillingHooks.useAiBalance();

  const limit = balance.limit;
  const used = balance.used;
  const pct = balance.percentUsed ?? 0;

  // Nothing to show for Free (limit 0) — user sees the exhausted state immediately.
  if (limit === 0) return null;

  const state: 'ok' | 'warn' | 'danger' =
    pct >= 100 ? 'danger' : pct >= 80 ? 'warn' : 'ok';

  const colorClass =
    state === 'danger'
      ? 'border-red-6 text-red-11 hover:bg-red-2'
      : state === 'warn'
        ? 'border-yellow-6 text-yellow-11 hover:bg-yellow-2'
        : 'border-gray-6 text-gray-11 hover:bg-gray-3';

  const content = (
    <Link
      to="/billing"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
        colorClass,
      )}
    >
      <Sparkles className="h-3 w-3" />
      <span>
        {used.toLocaleString()} / {limit.toLocaleString()}
      </span>
    </Link>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="bottom">
        {state === 'danger'
          ? t('AI credits exhausted — click to buy more')
          : t('AI credits used this month')}
      </TooltipContent>
    </Tooltip>
  );
}

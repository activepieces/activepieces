import { t } from 'i18next';
import { Info } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function UsageEstimateNote() {
  return (
    <span>
      {t(
        'Where your AI spend goes across flows, agents and chat. Costs are close estimates, not your bill.',
      )}{' '}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1 rounded-sm align-middle text-gray-12 underline decoration-gray-8 underline-offset-4 transition-colors hover:decoration-gray-12 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gray-8/50"
          >
            <Info className="size-3.5" />
            {t('Why estimates?')}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" sideOffset={8} className="w-96">
          <div className="flex flex-col gap-3 text-sm">
            <p className="font-medium text-gray-12">
              {t('Why these numbers are estimates')}
            </p>
            <ul className="flex list-disc flex-col gap-2 pl-4 text-gray-11">
              <li>
                {t(
                  'Most AI providers send back how many tokens a call used, not what it cost. We multiply those tokens by the model’s list price.',
                )}
              </li>
              <li>
                {t(
                  'Discounts, cached tokens, batch rates and price changes on your account can make your real bill a few percent different.',
                )}
              </li>
              <li>
                {t(
                  'When a provider does send the exact cost, we use it as is. Open a key to see how much was reported and how much was estimated.',
                )}
              </li>
              <li>{t('Activepieces credits are always exact.')}</li>
            </ul>
            <p className="border-t border-gray-6 pt-3 text-xs text-gray-11">
              {t(
                "For billing, your provider's own dashboard is the source of truth.",
              )}
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </span>
  );
}

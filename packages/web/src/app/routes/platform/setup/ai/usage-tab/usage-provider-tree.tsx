import { AIProviderName, isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { ChevronRight, Coins } from 'lucide-react';
import { Link } from 'react-router-dom';

import { adminSurface } from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import { SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import { cn } from '@/lib/utils';

import { ProviderLogo } from '../providers-tab/provider-logo';

import { UsageItem } from './usage-dummy-data';
import { usageFormat } from './usage-format';

export function UsageProviderTree({
  keys,
  models,
  totalUsd,
  search,
  className,
}: UsageProviderTreeProps) {
  const groups = providerGroups({ keys, models }).slice(0, PROVIDER_COUNT);
  return (
    <section
      className={cn(adminSurface.card, 'flex flex-col gap-3 p-5', className)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold text-gray-12">
            {t('Providers')}
          </h2>
          <p className="text-xs text-gray-11">
            {t('Provider, then key, then model')}
          </p>
        </div>
        {groups.length > 0 && (
          <Button variant="ghost" size="xs" asChild>
            <Link to={`/platform/ai/usage/key${search}`}>
              {t('See all')}
              <ChevronRight className="size-3.5" />
            </Link>
          </Button>
        )}
      </div>
      {groups.length === 0 ? (
        <p className="text-sm text-gray-11">
          {t('No AI usage in this period.')}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {groups.map((group) => (
            <li key={group.provider} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5">
                <ProviderMark provider={group.provider} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-12">
                  {providerName({ provider: group.provider })}
                </span>
                <span className="text-sm font-semibold tabular-nums text-gray-12">
                  {usageFormat.usd(group.spendUsd)}
                </span>
                <span className="w-10 text-right text-xs tabular-nums text-gray-11">
                  {usageFormat.percent(
                    totalUsd === 0 ? 0 : group.spendUsd / totalUsd,
                  )}
                </span>
              </div>
              <ul className="flex flex-col border-l border-gray-6 pl-3 ml-2">
                {group.keys.map((key) => (
                  <li key={key.item.id} className="flex flex-col">
                    <TreeLink item={key.item} search={search} emphasis />
                    {key.models.length > 0 && (
                      <ul className="flex flex-col border-l border-gray-5 pl-3 ml-1">
                        {key.models.map((model) => (
                          <li key={model.id}>
                            <TreeLink item={model} search={search} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TreeLink({
  item,
  search,
  emphasis = false,
}: {
  item: UsageItem;
  search: string;
  emphasis?: boolean;
}) {
  return (
    <Link
      to={`/platform/ai/usage/${item.dimension}/${item.id}${search}`}
      className="flex items-center gap-2 rounded-md py-1 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-gray-8/50"
    >
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-sm',
          emphasis ? 'font-medium text-gray-12' : 'text-gray-11',
        )}
      >
        {item.name}
      </span>
      <span
        className={cn(
          'text-sm tabular-nums',
          emphasis ? 'font-medium text-gray-12' : 'text-gray-11',
        )}
      >
        {usageFormat.usd(item.spendUsd)}
      </span>
      <ChevronRight className="size-3.5 shrink-0 text-gray-9" />
    </Link>
  );
}

function ProviderMark({ provider }: { provider: AIProviderName }) {
  const info = SUPPORTED_AI_PROVIDERS.find(
    (candidate) => candidate.provider === provider,
  );
  if (isNil(info)) {
    return (
      <span className="flex size-4 shrink-0 items-center justify-center text-gray-11">
        <Coins className="size-4" />
      </span>
    );
  }
  return <ProviderLogo info={info} size="sm" />;
}

function providerName({ provider }: { provider: AIProviderName }): string {
  if (provider === AIProviderName.ACTIVEPIECES) {
    return t('Credits');
  }
  return (
    SUPPORTED_AI_PROVIDERS.find((candidate) => candidate.provider === provider)
      ?.name ?? provider
  );
}

function providerGroups({
  keys,
  models,
}: {
  keys: UsageItem[];
  models: UsageItem[];
}): ProviderGroup[] {
  const providers = [
    ...new Set(
      keys.flatMap((key) => (isNil(key.provider) ? [] : [key.provider])),
    ),
  ];
  return providers
    .map((provider) => {
      const providerKeys = keys
        .filter((key) => key.provider === provider)
        .map((key) => ({
          item: key,
          models: models
            .filter((model) => model.keyId === key.id)
            .sort((a, b) => b.spendUsd - a.spendUsd)
            .slice(0, MODELS_PER_KEY),
        }));
      return {
        provider,
        spendUsd: providerKeys.reduce((sum, key) => sum + key.item.spendUsd, 0),
        keys: providerKeys.sort((a, b) => b.item.spendUsd - a.item.spendUsd),
      };
    })
    .sort((a, b) => b.spendUsd - a.spendUsd);
}

const PROVIDER_COUNT = 3;
const MODELS_PER_KEY = 2;

type ProviderGroup = {
  provider: AIProviderName;
  spendUsd: number;
  keys: { item: UsageItem; models: UsageItem[] }[];
};

type UsageProviderTreeProps = {
  keys: UsageItem[];
  models: UsageItem[];
  totalUsd: number;
  search: string;
  className?: string;
};

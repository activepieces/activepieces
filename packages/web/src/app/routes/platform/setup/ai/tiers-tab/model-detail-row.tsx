import {
  AIProviderModel,
  AIProviderWithoutSensitiveData,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ReactNode } from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { ModelCapabilityIcons } from '@/features/agents/ai-model/model-capability-icons';
import { modelMeta } from '@/features/agents/ai-model/model-meta';
import { cn } from '@/lib/utils';

import { ProviderLogo } from '../providers-tab/provider-logo';

export function ModelDetailRow({
  name,
  config,
  model,
  nameSuffix,
  trailing,
  loading = false,
  nested = false,
}: ModelDetailRowProps) {
  const metadata = model?.metadata;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pr-1">
      {config !== undefined && !nested && (
        <ProviderLogo
          info={modelMeta.providerInfoOf({ provider: config.provider })}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 items-center gap-1.5">
          <TextWithTooltip tooltipMessage={name}>
            <span className="truncate text-sm font-medium">{name}</span>
          </TextWithTooltip>
          {nameSuffix}
        </div>
        {config !== undefined && !nested && (
          <span className="truncate text-xs text-gray-11">{config.name}</span>
        )}
      </div>
      {loading && model === undefined && (
        <div className="hidden items-center gap-4 md:flex">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-28" />
        </div>
      )}
      {model !== undefined && (
        <div className="hidden items-center gap-4 md:flex">
          <Stat label={t('Context')} className="w-16">
            {metadata?.contextTokens === undefined
              ? EMPTY
              : modelMeta.formatContext({ tokens: metadata.contextTokens })}
          </Stat>
          <Stat label={t('Price per 1M')} className="w-28">
            {metadata?.inputCostPerMillionTokens === undefined ||
            metadata.outputCostPerMillionTokens === undefined ? (
              EMPTY
            ) : (
              <>
                {modelMeta.formatPrice({
                  perMillion: metadata.inputCostPerMillionTokens,
                })}
                <span className="text-gray-10"> / </span>
                {modelMeta.formatPrice({
                  perMillion: metadata.outputCostPerMillionTokens,
                })}
              </>
            )}
          </Stat>
          {config !== undefined && (
            <ModelCapabilityIcons
              provider={config.provider}
              metadata={metadata}
            />
          )}
        </div>
      )}
      {trailing}
    </div>
  );
}

function Stat({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <span className={cn('flex flex-col', className)}>
      <span className="text-xss uppercase tracking-wide text-gray-10">
        {label}
      </span>
      <span className="text-sm tabular-nums text-gray-12">{children}</span>
    </span>
  );
}

const EMPTY = '—';

type ModelDetailRowProps = {
  name: string;
  config: AIProviderWithoutSensitiveData | undefined;
  model: AIProviderModel | undefined;
  nameSuffix?: ReactNode;
  trailing?: ReactNode;
  loading?: boolean;
  nested?: boolean;
};

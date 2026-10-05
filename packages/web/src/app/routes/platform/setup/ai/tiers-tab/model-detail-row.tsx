import {
  AIProviderModel,
  AIProviderWithoutSensitiveData,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Brain, Wrench } from 'lucide-react';
import { ReactNode } from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { modelMeta } from '@/features/agents/ai-model/model-meta';

import { ProviderLogo } from '../providers-tab/provider-logo';

export function ModelDetailRow({
  name,
  config,
  model,
  nameSuffix,
  trailing,
}: ModelDetailRowProps) {
  const metadata = model?.metadata;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pr-1">
      {config !== undefined && (
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
        {config !== undefined && (
          <span className="truncate text-xs text-gray-11">{config.name}</span>
        )}
      </div>
      {metadata !== undefined && (
        <div className="hidden items-center gap-6 md:flex">
          {metadata.contextTokens !== undefined && (
            <Stat label={t('Context')}>
              {modelMeta.formatContext({ tokens: metadata.contextTokens })}
            </Stat>
          )}
          {metadata.inputCostPerMillionTokens !== undefined &&
            metadata.outputCostPerMillionTokens !== undefined && (
              <Stat label={t('Price per 1M')}>
                {modelMeta.formatPrice({
                  perMillion: metadata.inputCostPerMillionTokens,
                })}
                <span className="text-gray-10"> / </span>
                {modelMeta.formatPrice({
                  perMillion: metadata.outputCostPerMillionTokens,
                })}
              </Stat>
            )}
          <Capabilities model={model} />
        </div>
      )}
      {trailing}
    </div>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="flex min-w-16 flex-col">
      <span className="text-xss uppercase tracking-wide text-gray-10">
        {label}
      </span>
      <span className="text-sm tabular-nums text-gray-12">{children}</span>
    </span>
  );
}

function Capabilities({ model }: { model: AIProviderModel | undefined }) {
  const metadata = model?.metadata;
  const items = [
    ...(metadata?.supportsToolCalling === true
      ? [{ icon: Wrench, label: t('Supports tool calling') }]
      : []),
    ...(metadata?.supportsReasoning === true
      ? [{ icon: Brain, label: t('Supports reasoning') }]
      : []),
  ];
  return (
    <span className="flex w-14 items-center gap-1">
      {items.map(({ icon: Icon, label }) => (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            <span
              className="inline-flex size-6 items-center justify-center rounded-md bg-gray-3 text-gray-11"
              aria-label={label}
            >
              <Icon className="size-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </span>
  );
}

type ModelDetailRowProps = {
  name: string;
  config: AIProviderWithoutSensitiveData | undefined;
  model: AIProviderModel | undefined;
  nameSuffix?: ReactNode;
  trailing?: ReactNode;
};

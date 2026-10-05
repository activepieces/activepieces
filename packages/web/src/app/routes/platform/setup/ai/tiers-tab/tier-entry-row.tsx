import {
  AIProviderModel,
  AIProviderWithoutSensitiveData,
  PlatformModelTierEntry,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Brain, TriangleAlert, Wrench } from 'lucide-react';
import { ReactNode } from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { EntryWarning, modelMeta } from '@/features/agents/ai-model/model-meta';
import { cn } from '@/lib/utils';

import { keyStatusText } from '../providers-tab/key-status';
import { ProviderLogo } from '../providers-tab/provider-logo';

export function TierEntryRow({
  entry,
  isMain,
  isLast,
  config,
  model,
  warnings,
  menu,
}: TierEntryRowProps) {
  const name = model?.name ?? entry.modelId;
  const metadata = model?.metadata;
  return (
    <div className="flex items-stretch gap-3 px-2">
      <div className="flex w-4 shrink-0 flex-col items-center">
        <span className={cn('w-px flex-1', !isMain && 'bg-gray-6')} />
        <span
          className={cn(
            'my-1 shrink-0 rounded-full',
            isMain
              ? 'size-2.5 bg-accent-9 ring-4 ring-accent-3'
              : 'size-2 border-2 border-gray-8 bg-panel',
          )}
        />
        <span className={cn('w-px flex-1', !isLast && 'bg-gray-6')} />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-2.5 pr-1 hover:bg-gray-2">
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
            {isMain && (
              <span className="shrink-0 rounded-sm bg-accent-3 px-1.5 py-px text-xss font-medium uppercase tracking-wide text-accent-11">
                {t('Main')}
              </span>
            )}
            {warnings.length > 0 && <WarningsPopover warnings={warnings} />}
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
        {menu}
      </div>
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
  if (items.length === 0) {
    return null;
  }
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

function WarningsPopover({ warnings }: { warnings: EntryWarning[] }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="size-5 shrink-0 text-warning-11 hover:text-warning-12"
          aria-label={t('Warnings')}
        >
          <TriangleAlert className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 border-warning-7 bg-warning-3 p-3 text-warning-12"
      >
        <ul className="flex flex-col gap-1.5 text-xs">
          {warnings.map((warning) => (
            <li key={warning.code} className="flex items-start gap-1.5">
              <TriangleAlert className="mt-0.5 size-3 shrink-0" />
              <span>{warningText(warning)}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function warningText(warning: EntryWarning): string {
  switch (warning.code) {
    case 'keyMissing':
      return t('Key not found — this model is skipped');
    case 'modelGone':
      return t("Not in {key}'s model list anymore", { key: warning.keyName });
    case 'smallerContext':
      return t('Smaller context ({context}) than the main model ({main})', {
        context: modelMeta.formatContext({ tokens: warning.contextTokens }),
        main: modelMeta.formatContext({ tokens: warning.mainContextTokens }),
      });
    case 'keyStatus':
      return t('Key status: {status} — tried last', {
        status: keyStatusText({ status: warning.status }) ?? warning.status,
      });
  }
}

type TierEntryRowProps = {
  entry: PlatformModelTierEntry;
  isMain: boolean;
  isLast: boolean;
  config: AIProviderWithoutSensitiveData | undefined;
  model: AIProviderModel | undefined;
  warnings: EntryWarning[];
  menu: ReactNode;
};

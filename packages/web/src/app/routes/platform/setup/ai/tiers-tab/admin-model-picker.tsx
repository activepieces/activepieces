import {
  AIProviderModel,
  AIProviderWithoutSensitiveData,
  PlatformModelTierEntry,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Check, RefreshCw } from 'lucide-react';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import {
  KeyModelsById,
  modelMeta,
  PickableModel,
  RankedGroup,
  RankedModel,
  TradeOff,
} from '@/features/agents/ai-model/model-meta';
import { ModelRow } from '@/features/agents/ai-model/model-row';
import { cn } from '@/lib/utils';

import { KeyStatusBadge } from '../providers-tab/key-status';
import { ProviderLogo } from '../providers-tab/provider-logo';

export function AdminModelPicker({
  configs,
  keyModels,
  exclude,
  main,
  mode,
  onPick,
  open,
  onOpenChange,
  align = 'end',
  anchorOnly = false,
  children,
}: AdminModelPickerProps) {
  const pickable: PickableModel[] = configs.flatMap((config) =>
    (keyModels[config.id]?.models ?? []).map((model) => ({ config, model })),
  );
  const groups: PickerGroup[] =
    mode === 'fallback'
      ? modelMeta
          .rankForFallback({ main, candidates: pickable })
          .map((group) => ({
            key: group.kind,
            heading: rankedHeading({ kind: group.kind }),
            items: group.items,
          }))
      : groupByKey({ configs, pickable });
  const loadingKeys = configs.filter(
    (config) => keyModels[config.id]?.isLoading === true,
  );
  const failedKeys = configs.filter(
    (config) => keyModels[config.id]?.isError === true,
  );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {anchorOnly ? (
        <PopoverAnchor asChild>{children}</PopoverAnchor>
      ) : (
        <PopoverTrigger asChild>{children}</PopoverTrigger>
      )}
      <PopoverContent align={align} className="w-[380px] p-0">
        <Command>
          <CommandInput placeholder={t('Search models')} />
          <KeyNotices
            loadingKeys={loadingKeys}
            failedKeys={failedKeys}
            keyModels={keyModels}
          />
          <CommandList className="max-h-80">
            <CommandEmpty>{t('No models match')}</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup key={group.key} heading={group.heading}>
                {group.items.map((item) => {
                  const entry = {
                    configId: item.config.id,
                    modelId: item.model.id,
                  };
                  const taken = exclude.some((other) =>
                    modelMeta.sameEntry(other, entry),
                  );
                  return (
                    <CommandItem
                      key={modelMeta.entryKey({ entry })}
                      value={`${item.model.name} ${item.model.id} ${item.config.name} ${item.config.provider}`}
                      disabled={taken}
                      onSelect={() => {
                        onPick(entry);
                        onOpenChange(false);
                      }}
                      className={cn('cursor-pointer', taken && 'opacity-60')}
                    >
                      <div className="flex w-full flex-col gap-0.5">
                        <ModelRow
                          model={item.model}
                          info={
                            mode === 'fallback'
                              ? modelMeta.providerInfoOf({
                                  provider: item.config.provider,
                                })
                              : undefined
                          }
                          keyName={
                            mode === 'fallback' ? item.config.name : undefined
                          }
                          trailing={
                            taken ? (
                              <Check className="size-4 shrink-0 text-gray-11" />
                            ) : undefined
                          }
                        />
                        {item.tradeOffs.length > 0 && (
                          <span className="text-xs text-warning-11">
                            {item.tradeOffs.map(tradeOffText).join(' · ')}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function KeyNotices({
  loadingKeys,
  failedKeys,
  keyModels,
}: {
  loadingKeys: AIProviderWithoutSensitiveData[];
  failedKeys: AIProviderWithoutSensitiveData[];
  keyModels: KeyModelsById;
}) {
  if (loadingKeys.length === 0 && failedKeys.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-col gap-1.5 border-b border-gray-6/60 px-3 py-2">
      {loadingKeys.map((config) => (
        <div key={config.id} className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="h-3 w-40" />
        </div>
      ))}
      {failedKeys.map((config) => (
        <div
          key={config.id}
          className="flex items-center justify-between gap-2 text-xs text-gray-11"
        >
          <span>{t("Couldn't load {key} models", { key: config.name })}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={t('Retry')}
            onClick={() => keyModels[config.id]?.refetch()}
          >
            <RefreshCw className="size-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function groupByKey({
  configs,
  pickable,
}: {
  configs: AIProviderWithoutSensitiveData[];
  pickable: PickableModel[];
}): PickerGroup[] {
  return configs.flatMap((config) => {
    const items: RankedModel[] = pickable
      .filter((item) => item.config.id === config.id)
      .map((item) => ({ ...item, tradeOffs: [] }));
    if (items.length === 0) {
      return [];
    }
    return [
      {
        key: config.id,
        heading: (
          <span className="flex items-center gap-2">
            <ProviderLogo
              info={modelMeta.providerInfoOf({ provider: config.provider })}
              size="sm"
            />
            <span>{config.name}</span>
            {config.status !== 'active' && (
              <KeyStatusBadge status={config.status} />
            )}
          </span>
        ),
        items,
      },
    ];
  });
}

function rankedHeading({ kind }: { kind: RankedGroup['kind'] }): string {
  switch (kind) {
    case 'full':
      return t('Full matches');
    case 'tradeOff':
      return t('With trade-offs');
    case 'other':
      return t('Other models');
    default:
      return t('Models');
  }
}

function tradeOffText(tradeOff: TradeOff): string {
  switch (tradeOff.code) {
    case 'smallerContext':
      return t('Smaller context ({context})', {
        context: modelMeta.formatContext({ tokens: tradeOff.contextTokens }),
      });
    case 'noToolCalling':
      return t('No tool calling');
  }
}

type PickerGroup = {
  key: string;
  heading: ReactNode;
  items: RankedModel[];
};

type AdminModelPickerProps = {
  configs: AIProviderWithoutSensitiveData[];
  keyModels: KeyModelsById;
  exclude: PlatformModelTierEntry[];
  main?: AIProviderModel;
  mode: 'main' | 'fallback';
  onPick: (entry: PlatformModelTierEntry) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: 'start' | 'end';
  anchorOnly?: boolean;
  children: ReactNode;
};

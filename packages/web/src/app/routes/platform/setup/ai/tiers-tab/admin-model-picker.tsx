import {
  AIProviderModel,
  AIProviderWithoutSensitiveData,
  PlatformModelTierEntry,
} from '@activepieces/shared';
import { t } from 'i18next';
import { RefreshCw } from 'lucide-react';
import { ReactNode } from 'react';

import { LogoPlate } from '@/components/custom/logo-plate';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  KeyModelsById,
  modelMeta,
  PickableModel,
  RankedGroup,
  RankedModel,
  TradeOff,
} from '@/features/agents/ai-model/model-meta';
import {
  ModelPickerGroup,
  ModelPickerItem,
  ModelPickerPopover,
} from '@/features/agents/ai-model/model-picker-popover';
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
  const toItem = (
    item: RankedModel,
    { showKey }: { showKey: boolean },
  ): ModelPickerItem<PlatformModelTierEntry> => {
    const entry = { configId: item.config.id, modelId: item.model.id };
    const taken = exclude.some((other) => modelMeta.sameEntry(other, entry));
    const info = modelMeta.providerInfoOf({ provider: item.config.provider });
    return {
      id: modelMeta.entryKey({ entry }),
      value: entry,
      name: item.model.name,
      searchText: `${item.model.name} ${item.model.id} ${item.config.name} ${item.config.provider}`,
      subtitle: showKey ? item.config.name : undefined,
      leading:
        info.logoUrl === '' ? undefined : (
          <LogoPlate src={info.logoUrl} alt={info.name} size="xxs" />
        ),
      model: item.model,
      note:
        item.tradeOffs.length === 0
          ? undefined
          : item.tradeOffs.map(tradeOffText).join(' · '),
      disabled: taken,
      selected: taken,
    };
  };
  const groups: ModelPickerGroup<PlatformModelTierEntry>[] =
    mode === 'fallback'
      ? modelMeta
          .rankForFallback({ main, candidates: pickable })
          .map((group) => ({
            id: group.kind,
            heading: rankedHeading({ kind: group.kind }),
            items: group.items.map((item) => toItem(item, { showKey: true })),
          }))
      : configs.flatMap((config) => {
          const items = pickable
            .filter((item) => item.config.id === config.id)
            .map((item) =>
              toItem({ ...item, tradeOffs: [] }, { showKey: false }),
            );
          return items.length === 0
            ? []
            : [
                {
                  id: config.id,
                  heading: <KeyHeading config={config} />,
                  items,
                },
              ];
        });
  const loadingKeys = configs.filter(
    (config) => keyModels[config.id]?.isLoading === true,
  );
  const failedKeys = configs.filter(
    (config) => keyModels[config.id]?.isError === true,
  );

  return (
    <ModelPickerPopover
      groups={groups}
      notices={
        <KeyNotices
          loadingKeys={loadingKeys}
          failedKeys={failedKeys}
          keyModels={keyModels}
        />
      }
      emptyText={emptyTextOf({
        total: configs.length,
        loading: loadingKeys.length,
        failed: failedKeys.length,
        pickable: pickable.length,
      })}
      onPick={onPick}
      open={open}
      onOpenChange={onOpenChange}
      align={align}
      anchorOnly={anchorOnly}
    >
      {children}
    </ModelPickerPopover>
  );
}

function KeyHeading({ config }: { config: AIProviderWithoutSensitiveData }) {
  return (
    <span className="flex items-center gap-2">
      <ProviderLogo
        info={modelMeta.providerInfoOf({ provider: config.provider })}
        size="sm"
      />
      <span>{config.name}</span>
      {config.status !== 'active' && <KeyStatusBadge status={config.status} />}
    </span>
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
            disabled={keyModels[config.id]?.isFetching === true}
            onClick={() => keyModels[config.id]?.refetch()}
          >
            <RefreshCw
              className={cn(
                'size-3',
                keyModels[config.id]?.isFetching === true && 'animate-spin',
              )}
            />
          </Button>
        </div>
      ))}
    </div>
  );
}

function emptyTextOf({
  total,
  loading,
  failed,
  pickable,
}: {
  total: number;
  loading: number;
  failed: number;
  pickable: number;
}): string {
  if (total > 0 && loading === total) {
    return t('Loading models…');
  }
  if (total > 0 && failed === total) {
    return t("Couldn't load models");
  }
  return pickable === 0
    ? t('No text models on your keys yet')
    : t('No models match');
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

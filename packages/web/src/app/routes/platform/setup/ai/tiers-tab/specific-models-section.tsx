import {
  AIProviderWithoutSensitiveData,
  PlatformModelTier,
  PlatformModelTierEntry,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  KeyModelsById,
  modelMeta,
  PickableModel,
} from '@/features/agents/ai-model/model-meta';
import { platformModelTierMutations } from '@/features/platform-admin/hooks/platform-model-tier-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { SectionHeader } from '../components/section-header';
import { KeyStatusBadge } from '../providers-tab/key-status';
import { ProviderLogo } from '../providers-tab/provider-logo';

import { ModelDetailRow } from './model-detail-row';

export function SpecificModelsSection({
  tiers,
  ownKeys,
  keyModels,
  visible,
  onMakeTier,
}: SpecificModelsSectionProps) {
  const { mutate: setVisible, isPending } =
    platformModelTierMutations.useSetSpecificModelsVisible();
  const [search, setSearch] = useState('');
  const models = modelMeta.specificModelsOf({
    configs: ownKeys,
    keyModels,
    tiers,
  });
  const cannotHide = visible && tiers.length === 0;

  const needle = search.trim().toLowerCase();
  const matches = (item: PickableModel) =>
    needle === '' ||
    item.model.name.toLowerCase().includes(needle) ||
    item.model.id.toLowerCase().includes(needle);
  const groups = ownKeys
    .map((config) => ({
      config,
      state: keyModels[config.id],
      items: models.filter(
        (item) => item.config.id === config.id && matches(item),
      ),
    }))
    .filter(
      (group) =>
        needle === '' ||
        group.items.length > 0 ||
        group.config.name.toLowerCase().includes(needle),
    );

  return (
    <section className="flex flex-col rounded-xl border border-gray-6/60 bg-panel shadow-panel">
      <div className="flex flex-col gap-3 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <SectionHeader
            title={t('Specific models')}
            count={models.length}
            description={t("Models not used as a tier's main model.")}
          />
          <div className="flex shrink-0 flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              {isPending && (
                <Loader2
                  className="size-3.5 animate-spin text-gray-10"
                  aria-label={t('Saving')}
                />
              )}
              <Tabs
                value={visible ? 'visible' : 'hidden'}
                onValueChange={(value) => setVisible(value === 'visible')}
              >
                <TabsList
                  className="h-8"
                  aria-label={t('Specific models visible to builders')}
                  {...adminControl(
                    AdminControl.AI_SPECIFIC_MODELS_VISIBLE_TOGGLE,
                  )}
                >
                  <TabsTrigger
                    value="visible"
                    className="gap-1.5 text-xs"
                    disabled={isPending}
                  >
                    <Eye className="size-3.5" />
                    {t('Visible')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="hidden"
                    className="gap-1.5 text-xs"
                    disabled={cannotHide || isPending}
                  >
                    <EyeOff className="size-3.5" />
                    {t('Hidden')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <p className="text-xs text-gray-11">
              {cannotHide
                ? t('Add a tier before hiding these.')
                : visible
                ? t('Builders can pick these directly.')
                : t('Builders only see tiers.')}
            </p>
          </div>
        </div>
        {models.length > SEARCH_THRESHOLD && (
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('Search models')}
            aria-label={t('Search models')}
            className="max-w-sm"
          />
        )}
      </div>
      <div className="flex flex-col border-t border-gray-6/60">
        {groups.map((group) => (
          <KeyGroup
            key={group.config.id}
            config={group.config}
            items={group.items}
            total={
              models.filter((item) => item.config.id === group.config.id).length
            }
            hasTextModels={(group.state?.models?.length ?? 0) > 0}
            isLoading={group.state?.isLoading === true}
            isFetching={group.state?.isFetching === true}
            isError={group.state?.isError === true}
            onRetry={() => group.state?.refetch()}
            forceOpen={needle !== ''}
            defaultOpen={ownKeys.length === 1}
            onMakeTier={onMakeTier}
          />
        ))}
        {groups.length === 0 && (
          <p className="px-5 py-6 text-sm text-gray-11">
            {t('No models match')}
          </p>
        )}
      </div>
    </section>
  );
}

function KeyGroup({
  config,
  items,
  total,
  hasTextModels,
  isLoading,
  isFetching,
  isError,
  onRetry,
  forceOpen,
  defaultOpen,
  onMakeTier,
}: KeyGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [shown, setShown] = useState(PAGE_SIZE);
  const isOpen = forceOpen || open;
  const page = items.slice(0, shown);
  const retryButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={t('Retry')}
      disabled={isFetching}
      onClick={onRetry}
    >
      <RefreshCw className={cn('size-3', isFetching && 'animate-spin')} />
    </Button>
  );
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setOpen}
      className="border-b border-gray-6/60 last:border-b-0"
    >
      <div className="flex items-center gap-2 pr-5">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 px-5 py-3 text-left hover:bg-gray-2"
          >
            <ProviderLogo
              info={modelMeta.providerInfoOf({ provider: config.provider })}
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">
                {config.name}
              </span>
              <span className="text-xs text-gray-11">
                {isLoading ? (
                  <Skeleton className="h-3 w-20" />
                ) : isError ? (
                  t("Couldn't load {key} models", { key: config.name })
                ) : (
                  t('modelsCount', { count: total })
                )}
              </span>
            </span>
            <ChevronRight
              className={cn(
                'size-4 shrink-0 text-gray-10 transition-transform',
                isOpen && 'rotate-90',
              )}
            />
          </button>
        </CollapsibleTrigger>
        {config.status !== 'active' && (
          <KeyStatusBadge status={config.status} />
        )}
        {isError && retryButton}
      </div>
      <CollapsibleContent>
        <div className="flex flex-col pb-2 pl-5 pr-4">
          {isLoading &&
            [0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-3 py-2.5">
                <Skeleton className="size-8 rounded-lg" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          {isError && (
            <div className="flex items-center gap-2 py-3 text-sm text-gray-11">
              <span>
                {t("Couldn't load {key} models", { key: config.name })}
              </span>
              {retryButton}
            </div>
          )}
          {page.map(({ model }) => (
            <ModelDetailRow
              key={model.id}
              name={model.name}
              config={config}
              model={model}
              trailing={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onMakeTier({ configId: config.id, modelId: model.id })
                  }
                  {...adminControl(AdminControl.AI_TIER_FROM_MODEL_OPEN)}
                >
                  <Plus className="size-4" />
                  {t('Make a tier')}
                </Button>
              }
            />
          ))}
          {!isLoading && !isError && items.length === 0 && (
            <p className="py-3 text-sm text-gray-11">
              {total > 0
                ? t('No models match')
                : hasTextModels
                ? t("Every text model on this key is a tier's main model.")
                : t('No text models on this key.')}
            </p>
          )}
          {items.length > page.length && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => setShown((current) => current + PAGE_SIZE)}
            >
              {t('Show {count} more', {
                count: Math.min(PAGE_SIZE, items.length - page.length),
              })}
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

const PAGE_SIZE = 20;
const SEARCH_THRESHOLD = 10;

type SpecificModelsSectionProps = {
  tiers: PlatformModelTier[];
  ownKeys: AIProviderWithoutSensitiveData[];
  keyModels: KeyModelsById;
  visible: boolean;
  onMakeTier: (entry: PlatformModelTierEntry) => void;
};

type KeyGroupProps = {
  config: AIProviderWithoutSensitiveData;
  items: PickableModel[];
  total: number;
  hasTextModels: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
  forceOpen: boolean;
  defaultOpen: boolean;
  onMakeTier: (entry: PlatformModelTierEntry) => void;
};

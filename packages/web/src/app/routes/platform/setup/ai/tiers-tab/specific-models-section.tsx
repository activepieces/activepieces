import {
  AIProviderWithoutSensitiveData,
  PlatformModelTier,
  PlatformModelTierEntry,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronRight, Plus, RefreshCw, TriangleAlert } from 'lucide-react';
import { useId, useState } from 'react';

import { InstantSwitch, SettingsPanel } from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  KeyModelsById,
  modelMeta,
  PickableModel,
} from '@/features/agents/ai-model/model-meta';
import { platformModelTierMutations } from '@/features/platform-admin/hooks/platform-model-tier-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { ModelDetailRow } from '../components/model-detail-row';
import { KeyStatusBadge } from '../providers-tab/key-status';
import { ProviderLogo } from '../providers-tab/provider-logo';

export function SpecificModelsSection({
  tiers,
  ownKeys,
  keyModels,
  visible,
  projectsWithoutTier,
  onMakeTier,
}: SpecificModelsSectionProps) {
  const { mutateAsync: setVisible } =
    platformModelTierMutations.useSetSpecificModelsVisible();
  const visibleLabelId = useId();
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
    .map((config) => {
      const keyMatches = config.name.toLowerCase().includes(needle);
      return {
        config,
        keyMatches,
        state: keyModels[config.id],
        items: models.filter(
          (item) =>
            item.config.id === config.id && (keyMatches || matches(item)),
        ),
      };
    })
    .filter(
      (group) => needle === '' || group.items.length > 0 || group.keyMatches,
    );

  return (
    <SettingsPanel
      flush
      title={
        <span className="flex items-baseline gap-2">
          {t('Specific models')}
          <span className="text-sm font-normal tabular-nums text-gray-11">
            {models.length}
          </span>
        </span>
      }
      description={t("Models not used as a tier's main model.")}
      action={
        <div className="flex items-center gap-2">
          <span id={visibleLabelId} className="text-sm text-gray-11">
            {t('Visible to builders')}
          </span>
          <InstantSwitch
            checked={visible}
            blockedReason={
              cannotHide ? t('Add a tier before hiding these.') : undefined
            }
            onCheckedChange={(next) => setVisible(next)}
            undo
            successMessage={(next) =>
              next
                ? t('Specific models are visible to builders')
                : t('Specific models are hidden from builders')
            }
            confirmBefore={(next) =>
              next || projectsWithoutTier === 0
                ? null
                : {
                    title: t('Hide specific models from builders?'),
                    consequence: t('hidingLeavesProjectsEmpty', {
                      count: projectsWithoutTier,
                    }),
                    confirmLabel: t('Hide models'),
                  }
            }
            aria-labelledby={visibleLabelId}
            controlId={AdminControl.AI_SPECIFIC_MODELS_VISIBLE_TOGGLE}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-3 px-5 py-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-gray-11">
            {cannotHide
              ? t('Add a tier before hiding these.')
              : visible
              ? t('Builders can pick these directly.')
              : t('Builders only see tiers.')}
          </p>
          {!cannotHide && projectsWithoutTier > 0 && (
            <p className="flex items-center gap-1 text-sm text-warning-11">
              <TriangleAlert className="size-3.5 shrink-0" />
              {visible
                ? t('hidingLeavesProjectsEmpty', {
                    count: projectsWithoutTier,
                  })
                : t('projectsWithNothingToPick', {
                    count: projectsWithoutTier,
                  })}
            </p>
          )}
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
        <p className="px-5 py-6 text-sm text-gray-11">{t('No models match')}</p>
      )}
    </SettingsPanel>
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
      loading={isFetching}
      onClick={onRetry}
    >
      <RefreshCw className="size-3" />
    </Button>
  );
  return (
    <Collapsible open={isOpen} onOpenChange={setOpen}>
      <div className="flex items-center gap-2 pr-5 hover:bg-gray-2">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-5 text-left"
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
                  t('Trouble loading {key} models', { key: config.name })
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
        <div className="@container flex flex-col pb-2 pl-16 pr-4">
          {isLoading &&
            [0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-3 py-2.5">
                <Skeleton className="size-8 rounded-xl" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          {isError && (
            <div className="flex items-center gap-2 py-3 text-sm text-gray-11">
              <span>
                {t('Trouble loading {key} models', { key: config.name })}
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
              nested
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
  projectsWithoutTier: number;
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

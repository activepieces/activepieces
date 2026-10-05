import {
  AIProviderWithoutSensitiveData,
  PlatformModelTier,
  PlatformModelTierEntry,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Eye, EyeOff, Plus, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  KeyModelsById,
  modelMeta,
} from '@/features/agents/ai-model/model-meta';
import { ModelRow } from '@/features/agents/ai-model/model-row';
import { platformModelTierMutations } from '@/features/platform-admin/hooks/platform-model-tier-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { api } from '@/lib/api';

import { SectionHeader } from '../components/section-header';

export function SpecificModelsSection({
  tiers,
  ownKeys,
  keyModels,
  visible,
  reducedMotion,
  onMakeTier,
}: SpecificModelsSectionProps) {
  const { mutate: setVisible, isPending } =
    platformModelTierMutations.useSetSpecificModelsVisible();
  const [savedAt, setSavedAt] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(PAGE_SIZE);
  const models = modelMeta.specificModelsOf({
    configs: ownKeys,
    keyModels,
    tiers,
  });
  const cannotHide = visible && tiers.length === 0;
  const showSaved = useFlash({ at: savedAt, durationMs: 1500 });

  const toggle = (next: boolean) => {
    setError(undefined);
    setVisible(next, {
      onSuccess: () => setSavedAt(Date.now()),
      onError: (toggleError) =>
        setError(
          api.extractServerErrorMessage(
            toggleError,
            t('Could not save this setting'),
          ),
        ),
    });
  };

  const needle = search.trim().toLowerCase();
  const filtered =
    needle === ''
      ? models
      : models.filter(
          ({ model, config }) =>
            model.name.toLowerCase().includes(needle) ||
            model.id.toLowerCase().includes(needle) ||
            config.name.toLowerCase().includes(needle),
        );
  const page = filtered.slice(0, shown);
  const loadingKeys = ownKeys.filter(
    (config) => keyModels[config.id]?.isLoading,
  );
  const failedKeys = ownKeys.filter((config) => keyModels[config.id]?.isError);

  const visibilitySelect = (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span
          className="text-xs text-success-11"
          aria-live="polite"
          role="status"
        >
          {showSaved && (
            <span className="inline-flex items-center gap-1">
              <Check className="size-3" />
              {t('Saved')}
            </span>
          )}
        </span>
        <Select
          value={visible ? 'visible' : 'hidden'}
          onValueChange={(value) => toggle(value === 'visible')}
          disabled={cannotHide || isPending}
        >
          <SelectTrigger
            size="sm"
            className="w-auto"
            aria-label={t('Specific models visible to builders')}
            {...adminControl(AdminControl.AI_SPECIFIC_MODELS_VISIBLE_TOGGLE)}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="visible">
              <Eye />
              {t('Visible to builders')}
            </SelectItem>
            <SelectItem value="hidden">
              <EyeOff />
              {t('Hidden from builders')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {cannotHide && (
        <p className="text-xs text-gray-11">
          {t('Add a tier before hiding these.')}
        </p>
      )}
      {error !== undefined && (
        <p className="text-xs text-danger-11" role="alert">
          {error}
        </p>
      )}
    </div>
  );

  if (!visible) {
    return (
      <section className="flex flex-col gap-4 border-t border-gray-6/60 pt-6">
        <div className="flex items-center gap-3 rounded-xl border border-gray-6/60 bg-panel px-5 py-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-3 text-gray-11">
            <EyeOff className="size-4" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-sm font-semibold">
              {t('Specific models hidden from builders')}
            </p>
            <p className="text-xs text-gray-11">
              {t('specificModelsHiddenCount', { count: models.length })}
            </p>
          </div>
          {visibilitySelect}
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 border-t border-gray-6/60 pt-6">
      <div className="flex items-start justify-between gap-3">
        <SectionHeader
          title={t('Specific models')}
          count={models.length}
          description={t("Models not used as a tier's main model.")}
        />
        {visibilitySelect}
      </div>
      <AnimatePresence initial={false}>
        <motion.div
          key="list"
          initial={reducedMotion ? false : { height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="flex flex-col gap-3">
            {models.length > SEARCH_THRESHOLD && (
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setShown(PAGE_SIZE);
                }}
                placeholder={t('Search models')}
                aria-label={t('Search models')}
                className="max-w-sm"
              />
            )}
            <div className="overflow-hidden rounded-xl border border-gray-6/60 bg-panel">
              {loadingKeys.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center gap-3 border-b border-gray-6/60 px-4 py-3 last:border-b-0"
                >
                  <Skeleton className="size-6 rounded-md" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
              ))}
              {failedKeys.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between gap-3 border-b border-gray-6/60 px-4 py-3 text-xs text-gray-11 last:border-b-0"
                >
                  <span>
                    {t("Couldn't load {key} models", { key: config.name })}
                  </span>
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
              {page.map(({ config, model }) => (
                <div
                  key={`${config.id}:${model.id}`}
                  className="flex items-center gap-3 border-b border-gray-6/60 px-4 py-3 last:border-b-0"
                >
                  <ModelRow
                    model={model}
                    info={modelMeta.providerInfoOf({
                      provider: config.provider,
                    })}
                    keyName={config.name}
                  />
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
                </div>
              ))}
              {page.length === 0 &&
                loadingKeys.length === 0 &&
                failedKeys.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-gray-11">
                    {models.length === 0
                      ? t(
                          "Every text model on your keys is a tier's main model.",
                        )
                      : t('No models match')}
                  </p>
                )}
            </div>
            {filtered.length > page.length && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => setShown((current) => current + PAGE_SIZE)}
              >
                {t('Show {count} more', {
                  count: Math.min(PAGE_SIZE, filtered.length - page.length),
                })}
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function useFlash({
  at,
  durationMs,
}: {
  at: number | undefined;
  durationMs: number;
}): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (at === undefined) {
      return;
    }
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [at, durationMs]);
  return visible;
}

const PAGE_SIZE = 20;
const SEARCH_THRESHOLD = 10;

type SpecificModelsSectionProps = {
  tiers: PlatformModelTier[];
  ownKeys: AIProviderWithoutSensitiveData[];
  keyModels: KeyModelsById;
  visible: boolean;
  reducedMotion: boolean;
  onMakeTier: (entry: PlatformModelTierEntry) => void;
};

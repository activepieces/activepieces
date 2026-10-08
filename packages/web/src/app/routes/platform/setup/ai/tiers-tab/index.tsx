import {
  PlatformModelTier,
  PlatformModelTierEntry,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Layers, Plus } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { modelMeta } from '@/features/agents/ai-model/model-meta';
import { aiProviderQueries } from '@/features/platform-admin/hooks/ai-provider-hooks';
import {
  platformModelTierMutations,
  platformModelTierQueries,
} from '@/features/platform-admin/hooks/platform-model-tier-hooks';
import { projectCollectionUtils } from '@/features/projects';
import { platformConfigurationHooks } from '@/hooks/platform-configuration-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { SectionHeader } from '../components/section-header';

import { DeleteTierDialog } from './delete-tier-dialog';
import { SpecificModelsSection } from './specific-models-section';
import { TierCard } from './tier-card';
import { TierDialog, TierDialogState } from './tier-dialog';

export function TiersTab() {
  const reducedMotion = useReducedMotion() ?? false;
  const {
    data: tiers,
    isLoading: tiersLoading,
    isError: tiersError,
    refetch: refetchTiers,
  } = platformModelTierQueries.useAdminList();
  const {
    data: configs,
    isLoading: configsLoading,
    isError: configsError,
    refetch: refetchConfigs,
  } = aiProviderQueries.useAiProviderConfigs();
  const { data: configuration, isLoading: configurationLoading } =
    platformConfigurationHooks.useCurrentPlatformConfiguration();
  const allConfigs = useMemo(() => configs ?? [], [configs]);
  const keyModels = platformModelTierQueries.useKeyModels(allConfigs);
  const { mutate: reorder, isPending: reordering } =
    platformModelTierMutations.useReorder();
  const [dialog, setDialog] = useState<TierDialogState>({ open: false });
  const [deleting, setDeleting] = useState<PlatformModelTier | null>(null);
  const [focusTarget, setFocusTarget] = useState<HTMLElement | null>(null);
  const [previewProjectId, setPreviewProjectId] = useState<string | null>(null);
  const { data: projects } = projectCollectionUtils.useAllPlatformProjects();
  const projectIds = useMemo(
    () => projects.map((project) => project.id),
    [projects],
  );

  const ownKeys = useMemo(
    () => allConfigs.filter(modelMeta.isOwnKey),
    [allConfigs],
  );
  const configsById = useMemo(
    () => new Map(allConfigs.map((config) => [config.id, config])),
    [allConfigs],
  );
  const liveTiers = tiers ?? [];
  const specificModelsVisible = configuration?.aiSpecificModelsVisible ?? true;
  const someKeyIsScoped = ownKeys.some((key) => key.projectScope !== 'all');
  const showPreview = someKeyIsScoped && projects.length > 1;

  const openCreate = ({
    trigger,
    initialMain,
  }: {
    trigger: HTMLElement | null;
    initialMain?: PlatformModelTierEntry;
  }) => {
    setFocusTarget(trigger);
    setDialog({ open: true, mode: 'create', initialMain });
  };

  if (tiersLoading || configsLoading || configurationLoading) {
    return <TiersSkeleton />;
  }

  const isError =
    (tiersError && tiers === undefined) ||
    (configsError && configs === undefined);
  const noKeys = ownKeys.length === 0 && liveTiers.length === 0;
  const retry = () => Promise.all([refetchTiers(), refetchConfigs()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <SectionHeader
          title={t('Tiers')}
          isPageTitle
          count={isError ? undefined : liveTiers.length}
          description={t(
            'Named model groups your builders pick. Each one is a main model plus fallbacks.',
          )}
        />
        {!isError && !noKeys && (
          <div className="flex shrink-0 items-center gap-2">
            {showPreview && (
              <Select
                value={previewProjectId ?? ALL_PROJECTS}
                onValueChange={(value) =>
                  setPreviewProjectId(value === ALL_PROJECTS ? null : value)
                }
              >
                <SelectTrigger
                  size="sm"
                  className="w-48"
                  aria-label={t('Preview as project')}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value={ALL_PROJECTS}>
                    {t('All projects')}
                  </SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {t('As {project}', { project: project.displayName })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              id={NEW_TIER_BUTTON_ID}
              size="sm"
              className="shrink-0"
              onClick={(event) => openCreate({ trigger: event.currentTarget })}
              {...adminControl(AdminControl.AI_TIER_OPEN)}
            >
              <Plus className="size-4" />
              {t('New tier')}
            </Button>
          </div>
        )}
      </div>

      {isError ? (
        <DataFetchErrorState entity={t('tiers')} onRetry={retry} />
      ) : noKeys ? (
        <NoKeysState />
      ) : (
        <>
          {liveTiers.length === 0 ? (
            <NoTiersState onCreate={(trigger) => openCreate({ trigger })} />
          ) : (
            <div className="flex flex-col gap-4">
              <AnimatePresence initial={false}>
                {liveTiers.map((tier, position) => (
                  <motion.div
                    key={tier.id}
                    layout={!reducedMotion}
                    initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reducedMotion ? undefined : { opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <TierCard
                      tier={tier}
                      configsById={configsById}
                      ownKeys={ownKeys}
                      keyModels={keyModels}
                      projectIds={projectIds}
                      previewProjectId={previewProjectId}
                      reducedMotion={reducedMotion}
                      onEdit={(trigger) => {
                        setFocusTarget(trigger);
                        setDialog({ open: true, mode: 'edit', tier });
                      }}
                      onDelete={(trigger) => {
                        setFocusTarget(trigger);
                        setDeleting(tier);
                      }}
                      onMoveUp={
                        position === 0 || reordering
                          ? undefined
                          : () =>
                              reorder({
                                tierIds: movedIds({
                                  tiers: liveTiers,
                                  from: position,
                                  to: position - 1,
                                }),
                              })
                      }
                      onMoveDown={
                        position === liveTiers.length - 1 || reordering
                          ? undefined
                          : () =>
                              reorder({
                                tierIds: movedIds({
                                  tiers: liveTiers,
                                  from: position,
                                  to: position + 1,
                                }),
                              })
                      }
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          <SpecificModelsSection
            tiers={liveTiers}
            ownKeys={ownKeys}
            keyModels={keyModels}
            visible={specificModelsVisible}
            projectsWithoutTier={modelMeta.projectsWithoutTier({
              tiers: liveTiers,
              configsById,
              projectIds,
            })}
            onMakeTier={(entry) =>
              openCreate({
                trigger:
                  document.activeElement instanceof HTMLElement
                    ? document.activeElement
                    : null,
                initialMain: entry,
              })
            }
          />
        </>
      )}

      <TierDialog
        state={dialog}
        onOpenChange={(open) => {
          if (!open) {
            setDialog({ open: false });
          }
        }}
        ownKeys={ownKeys}
        keyModels={keyModels}
        returnFocusTo={focusTarget}
        onReturnFocus={focusBack}
      />
      <DeleteTierDialog
        tier={deleting}
        tiers={liveTiers}
        specificModelsVisible={specificModelsVisible}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
        returnFocusTo={focusTarget}
        onReturnFocus={focusBack}
      />
    </div>
  );
}

function movedIds({
  tiers,
  from,
  to,
}: {
  tiers: PlatformModelTier[];
  from: number;
  to: number;
}): string[] {
  const ids = tiers.map((tier) => tier.id);
  const without = ids.filter((_, index) => index !== from);
  return [...without.slice(0, to), ids[from], ...without.slice(to)];
}

function focusBack({ target }: { target: HTMLElement | null }): void {
  const alive = target !== null && document.contains(target) ? target : null;
  (alive ?? document.getElementById(NEW_TIER_BUTTON_ID))?.focus();
}

function NoKeysState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-6/60 bg-panel px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-accent-3">
        <Layers className="size-5 text-accent-11" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold tracking-tight">
          {t('Add a provider key first')}
        </p>
        <p className="max-w-md text-sm text-gray-11">
          {t("Tiers are built from your keys' models.")}
        </p>
      </div>
      <Button asChild variant="outline">
        <Link to="/platform/ai">{t('Go to Providers')}</Link>
      </Button>
    </div>
  );
}

function NoTiersState({
  onCreate,
}: {
  onCreate: (trigger: HTMLElement | null) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-gray-6 bg-panel px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-accent-3">
        <Layers className="size-5 text-accent-11" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold tracking-tight">
          {t('Create your first tier')}
        </p>
        <p className="max-w-md text-sm text-gray-11">
          {t('Name it, pick a main model, add fallbacks.')}
        </p>
      </div>
      <Button
        onClick={(event) => onCreate(event.currentTarget)}
        {...adminControl(AdminControl.AI_TIER_OPEN)}
      >
        <Plus className="size-4" />
        {t('New tier')}
      </Button>
    </div>
  );
}

function TiersSkeleton() {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      role="status"
      aria-label={t('Loading tiers')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      {[0, 1].map((card) => (
        <section
          key={card}
          className="rounded-xl border border-gray-6/60 bg-panel shadow-panel"
        >
          <div className="flex items-center gap-3 px-5 py-4">
            <Skeleton className="size-10 shrink-0 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="size-8 rounded-md" />
          </div>
          <div className="flex flex-col border-t border-gray-6/60 px-3 pb-3 pt-3">
            <Skeleton className="mx-2 mb-2 h-3 w-28" />
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-3 px-2 py-2.5">
                <Skeleton className="size-2 shrink-0 rounded-full" />
                <Skeleton className="size-8 shrink-0 rounded-lg" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="hidden items-center gap-4 md:flex">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="size-6 rounded-md" />
                </div>
                <Skeleton className="size-6 rounded-md" />
              </div>
            ))}
            <Skeleton className="mx-2 mt-1 h-8 w-28 rounded-md" />
          </div>
        </section>
      ))}
      <section className="rounded-xl border border-gray-6/60 bg-panel shadow-panel">
        <div className="flex items-start justify-between gap-3 px-5 py-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3.5 w-56" />
          </div>
          <Skeleton className="h-8 w-40 rounded-md" />
        </div>
        {[0, 1].map((row) => (
          <div
            key={row}
            className="flex items-center gap-3 border-t border-gray-6/60 px-5 py-3"
          >
            <Skeleton className="size-8 shrink-0 rounded-lg" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="size-4 rounded-sm" />
          </div>
        ))}
      </section>
    </div>
  );
}

const NEW_TIER_BUTTON_ID = 'new-tier-button';
const ALL_PROJECTS = 'all-projects';

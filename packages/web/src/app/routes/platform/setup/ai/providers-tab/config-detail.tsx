import {
  AIProviderModelType,
  AIProviderWithoutSensitiveData,
  AiProviderModelScope,
  AiProviderProjectScope,
  CloudflareGatewayProviderConfig,
  formErrors,
  OpenAICompatibleProviderConfig,
  PlatformModelTier,
  Project,
  ProviderModelConfig,
  UpdateAIProviderRequest,
  VertexProviderConfig,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { ChevronLeft, KeyRound, RefreshCw, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { z } from 'zod';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import {
  LeaveWithoutSavingDialog,
  useWarnBeforeLosingChanges,
} from '@/components/custom/leave-without-saving';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AiProviderInfo } from '@/features/agents';
import {
  KeyScopeImpact,
  modelMeta,
} from '@/features/agents/ai-model/model-meta';
import { aiProviderApi, aiProviderKeys } from '@/features/platform-admin';
import { aiProviderQueries } from '@/features/platform-admin/hooks/ai-provider-hooks';
import { platformModelTierQueries } from '@/features/platform-admin/hooks/platform-model-tier-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { formatUtils } from '@/lib/format-utils';

import { SectionHeader } from '../components/section-header';

import { KeyModelList } from './key-model-list';
import { KeyStatusBadge } from './key-status';
import { ManualModelList } from './manual-model-list';
import { ProjectSelectionPanel } from './project-selection-panel';
import { providerCredentials } from './provider-credentials';
import { ProviderLogo } from './provider-logo';

export function ConfigDetail({
  config,
  info,
  projects,
  isSaving,
  onSave,
  onDelete,
  onReplaceCredentials,
  isRechecking,
  onRecheck,
  onBack,
}: {
  config: AIProviderWithoutSensitiveData;
  info: AiProviderInfo;
  projects: Project[];
  isSaving: boolean;
  onSave: (request: UpdateAIProviderRequest) => Promise<{ error: unknown }>;
  onDelete: () => Promise<unknown>;
  onReplaceCredentials: () => void;
  isRechecking: boolean;
  onRecheck: () => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState<ConfigDraft>(draftOf(config));
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [scopeImpact, setScopeImpact] = useState<KeyScopeImpact[]>([]);
  const { data: tiers } = platformModelTierQueries.useAdminList();
  const { data: allConfigs } = aiProviderQueries.useAiProviderConfigs();
  const leavingOnPurpose = useRef(false);
  const saveInFlight = useRef(false);

  const manualModels = providerCredentials.usesManualModels({
    provider: config.provider,
  });
  const { data: models = [], isLoading: isLoadingModels } = useQuery({
    queryKey: aiProviderKeys.configModels(config.id),
    queryFn: () => aiProviderApi.listModelsForConfig(config.id),
    enabled: !manualModels,
  });
  const selectableModels = [
    ...models,
    ...draft.modelIds
      .filter((modelId) => !models.some((model) => model.id === modelId))
      .map((modelId) => ({
        id: modelId,
        name: modelId,
        type: AIProviderModelType.TEXT,
      })),
  ];
  const staleIds = draft.modelIds.filter(
    (modelId) => !models.some((model) => model.id === modelId),
  );
  const tiersByModel = tierNamesByModel({
    tiers: tiers ?? [],
    configId: config.id,
  });
  const usedByTierCount = (tiers ?? []).filter((tier) =>
    tier.entries.some((entry) => entry.configId === config.id),
  ).length;
  const withTierModels = (modelIds: string[]) => [
    ...new Set([...modelIds, ...tiersByModel.keys()]),
  ];
  const dirty = JSON.stringify(draft) !== JSON.stringify(draftOf(config));
  const leaveBlocker = useWarnBeforeLosingChanges({
    hasChanges: dirty,
    standDown: leavingOnPurpose,
    blockSearchChanges: true,
  });
  const statusDetail = [
    config.statusReason,
    config.statusUpdated &&
      t('Last checked {when}', {
        when: formatUtils.formatDateToAgo(new Date(config.statusUpdated)),
      }),
  ]
    .filter(Boolean)
    .join(' · ');
  const metaLine = [
    info.name,
    usedByTierCount > 0 && t('usedByTiersCount', { count: usedByTierCount }),
    config.enabledForChat && t('Chat provider'),
    statusDetail,
  ]
    .filter(Boolean)
    .join(' · ');
  const nameMissing = draft.name.trim().length === 0;
  const enabledModelCount = manualModels
    ? draft.models.length
    : draft.modelScope === 'all'
    ? models.length
    : draft.modelIds.length;
  const allowedProjectCount =
    draft.projectScope === 'all'
      ? projects.length
      : draft.projectScope === 'except'
      ? projects.length - draft.projectIds.length
      : draft.projectIds.length;

  const requestSave = () => {
    if (nameMissing || saveInFlight.current) {
      return;
    }
    const impact = modelMeta.keyScopeImpact({
      tiers: tiers ?? [],
      configsById: new Map(
        (allConfigs ?? []).map((other) => [other.id, other]),
      ),
      config: {
        ...config,
        projectScope: draft.projectScope,
        projectIds: draft.projectIds,
      },
      projectIds: projects.map((project) => project.id),
    });
    if (impact.length > 0) {
      setScopeImpact(impact);
      return;
    }
    return save();
  };

  const save = async (): Promise<boolean> => {
    const manualConfigParse = manualModels
      ? ManualProviderConfig.safeParse(config.config)
      : undefined;
    const manualConfig = manualConfigParse?.success
      ? manualConfigParse.data
      : undefined;
    if (nameMissing || saveInFlight.current) {
      return false;
    }
    saveInFlight.current = true;
    try {
      const { error } = await onSave({
        displayName: draft.name.trim(),
        modelScope: draft.modelScope,
        modelIds: manualModels
          ? draft.models.map((model) => model.modelId)
          : draft.modelIds,
        projectScope: draft.projectScope,
        projectIds: draft.projectIds,
        ...(manualConfig
          ? {
              config: { ...manualConfig, models: draft.models },
            }
          : {}),
      });
      return error === null || error === undefined;
    } finally {
      saveInFlight.current = false;
    }
  };

  return (
    <div className="flex grow flex-col gap-6 pb-4">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex w-fit items-center gap-1 text-sm text-gray-11 transition-colors hover:text-gray-12"
        >
          <ChevronLeft className="size-4" />
          {t('Providers')}
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <ProviderLogo info={info} />
            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate text-lg font-semibold leading-none tracking-tight">
                  {draft.name}
                </h1>
                <KeyStatusBadge status={config.status} />
              </div>
              <p className="text-xs text-gray-11">{metaLine}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            loading={isRechecking}
            onClick={onRecheck}
            {...adminControl(AdminControl.AI_PROVIDER_KEY_RECHECK_RUN)}
          >
            <RefreshCw className="size-4" />
            {t('Recheck')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="models" className="flex flex-col gap-6">
        <TabsList
          variant="outline"
          className="w-full justify-start border-b border-gray-6"
        >
          <TabsTrigger variant="outline" value="models">
            {t('Models')}
            {!isLoadingModels && <TabCount count={enabledModelCount} />}
          </TabsTrigger>
          <TabsTrigger variant="outline" value="access">
            {t('Access')}
            <TabCount count={allowedProjectCount} />
          </TabsTrigger>
          <TabsTrigger variant="outline" value="settings">
            {t('Settings')}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="models"
          forceMount
          className="mt-0 flex flex-col gap-3 data-[state=inactive]:hidden"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionHeader
              title={t('Models')}
              description={
                manualModels
                  ? t('Model ids exposed through this key.')
                  : t('Which of this key’s models the platform may use.')
              }
            />
            {!manualModels && (
              <ScopeTabs
                value={draft.modelScope}
                disabled={isLoadingModels}
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    modelScope: value === 'all' ? 'all' : 'selected',
                    modelIds:
                      value === 'all'
                        ? []
                        : withTierModels(models.map((model) => model.id)),
                  })
                }
                options={[
                  { value: 'all', label: t('All models') },
                  { value: 'selected', label: t('Only selected') },
                ]}
              />
            )}
          </div>
          {manualModels ? (
            <ManualModelList
              models={draft.models}
              tiersByModel={tiersByModel}
              onChange={(models) => setDraft({ ...draft, models })}
            />
          ) : (
            <KeyModelList
              config={config}
              models={draft.modelScope === 'all' ? models : selectableModels}
              staleIds={staleIds}
              tiersByModel={tiersByModel}
              allModels={draft.modelScope === 'all'}
              selectedIds={draft.modelIds}
              isLoading={isLoadingModels}
              onChange={(modelIds) =>
                setDraft({ ...draft, modelIds: withTierModels(modelIds) })
              }
            />
          )}
        </TabsContent>

        <TabsContent
          value="access"
          forceMount
          className="mt-0 flex flex-col gap-3 data-[state=inactive]:hidden"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionHeader
              title={t('Project access')}
              description={
                draft.projectScope === 'except'
                  ? t(
                      'Every project except these — new projects get access automatically.',
                    )
                  : draft.projectScope === 'selected'
                  ? t('Only these projects can use this key.')
                  : t('Every project on this platform can use it.')
              }
            />
            <ScopeTabs
              value={draft.projectScope}
              onChange={(value) =>
                setDraft({
                  ...draft,
                  projectScope:
                    value === 'all'
                      ? 'all'
                      : value === 'except'
                      ? 'except'
                      : 'selected',
                  projectIds: value === 'all' ? [] : draft.projectIds,
                })
              }
              options={[
                { value: 'all', label: t('All') },
                { value: 'selected', label: t('Only selected') },
                { value: 'except', label: t('All except') },
              ]}
            />
          </div>
          {draft.projectScope !== 'all' && (
            <ProjectSelectionPanel
              projects={projects}
              selectedIds={draft.projectIds}
              onChange={(projectIds) => setDraft({ ...draft, projectIds })}
            />
          )}
        </TabsContent>

        <TabsContent
          value="settings"
          forceMount
          className="mt-0 flex flex-col gap-8 data-[state=inactive]:hidden"
        >
          <section className="flex flex-col gap-3">
            <SectionHeader
              title={t('General')}
              description={t('How this key is labelled and authorised.')}
            />
            <div className="flex flex-col divide-y divide-gray-6/60 rounded-xl border border-gray-6/60">
              <div className="flex flex-col gap-1.5 p-4">
                <Label htmlFor="config-name">{t('Name')}</Label>
                <Input
                  id="config-name"
                  value={draft.name}
                  onChange={(event) =>
                    setDraft({ ...draft, name: event.target.value })
                  }
                  className="max-w-sm"
                  aria-invalid={nameMissing}
                />
                {nameMissing && (
                  <p className="text-sm text-danger-11">
                    {t(formErrors.required)}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gray-3/60">
                    <KeyRound className="size-4 text-gray-11" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-none">
                      {t('Credentials')}
                    </p>
                    <p className="mt-1 truncate font-mono text-xs text-gray-11">
                      {t('Stored securely')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReplaceCredentials}
                  {...adminControl(
                    AdminControl.AI_PROVIDER_KEY_CREDENTIALS_OPEN,
                  )}
                >
                  {t('Replace')}
                </Button>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <SectionHeader
              title={t('Danger zone')}
              description={t('Irreversible actions for this key.')}
            />
            <div className="flex items-center justify-between gap-3 rounded-xl border border-danger-6 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-none">
                  {t('Delete this key')}
                </p>
                <p className="mt-1 text-sm text-gray-11">
                  {t('Flows and agents that use it will fail.')}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-2 border-danger-7 text-danger-11 enabled:hover:bg-danger-3 enabled:hover:text-danger-11"
                onClick={() => setDeleteOpen(true)}
                {...adminControl(AdminControl.AI_PROVIDER_KEY_DELETE_OPEN)}
              >
                <Trash2 className="size-4" />
                {t('Delete')}
              </Button>
            </div>
            <ConfirmationDeleteDialog
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              title={t('Delete {name}', { name: config.name })}
              message={t('Flows and agents that use this key will fail.')}
              entityName={config.name}
              showToast={true}
              onError={() => undefined}
              controlId={AdminControl.AI_PROVIDER_KEY_DELETE_CONFIRM}
              mutationFn={async () => {
                await onDelete();
                leavingOnPurpose.current = true;
                onBack();
              }}
            />
          </section>
        </TabsContent>
      </Tabs>

      {dirty && (
        <div className="sticky bottom-4 z-20 mt-auto flex justify-center px-4">
          <div className="flex animate-in items-center gap-3 rounded-xl border bg-gray-1/95 px-4 py-2.5 shadow-lg backdrop-blur-sm duration-200 fade-in slide-in-from-bottom-4">
            <span className="text-sm">{t('You have unsaved changes')}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDraft(draftOf(config))}
            >
              {t('Discard')}
            </Button>
            <Button
              size="sm"
              loading={isSaving}
              disabled={nameMissing || isSaving}
              keyboardShortcut="S"
              onKeyboardShortcut={requestSave}
              onClick={requestSave}
              {...adminControl(AdminControl.AI_PROVIDER_KEY_SETTINGS_SUBMIT)}
            >
              {t('Save')}
            </Button>
          </div>
        </div>
      )}

      <ConfirmationDeleteDialog
        open={scopeImpact.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setScopeImpact([]);
          }
        }}
        title={t('Change which projects can use {name}?', {
          name: config.name,
        })}
        message={
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {scopeImpact.map((impact) => (
              <li key={impact.tierName}>{scopeImpactText(impact)}</li>
            ))}
          </ul>
        }
        entityName={config.name}
        isDanger={false}
        buttonText={t('Save anyway')}
        showToast={false}
        mutationFn={async () => {
          if (!(await save())) {
            throw new Error('Saving the key failed');
          }
        }}
      />

      <LeaveWithoutSavingDialog
        open={leaveBlocker.state === 'blocked'}
        onKeepEditing={() => leaveBlocker.reset?.()}
        onDiscard={() => leaveBlocker.proceed?.()}
      />
    </div>
  );
}

function scopeImpactText(impact: KeyScopeImpact): string {
  if (impact.lostProjects > 0) {
    return t('tierLosesProjects', {
      tier: impact.tierName,
      count: impact.lostProjects,
    });
  }
  return t('tierFallbackSkippedInMoreProjects', {
    tier: impact.tierName,
    count: impact.skippedProjects,
  });
}

function ScopeTabs({
  value,
  disabled = false,
  onChange,
  options,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-44 shrink-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TabCount({ count }: { count: number }) {
  return (
    <Badge variant="secondary" className="ml-2 tabular-nums">
      {count}
    </Badge>
  );
}

function tierNamesByModel({
  tiers,
  configId,
}: {
  tiers: PlatformModelTier[];
  configId: string;
}): Map<string, string[]> {
  return tiers.reduce((byModel, tier) => {
    tier.entries
      .filter((entry) => entry.configId === configId)
      .forEach((entry) =>
        byModel.set(entry.modelId, [
          ...(byModel.get(entry.modelId) ?? []),
          tier.name,
        ]),
      );
    return byModel;
  }, new Map<string, string[]>());
}

function draftOf(config: AIProviderWithoutSensitiveData): ConfigDraft {
  const manualModels = providerCredentials.usesManualModels({
    provider: config.provider,
  });
  return {
    name: config.name,
    modelScope: config.modelScope,
    modelIds: config.modelIds,
    models:
      manualModels && 'models' in config.config ? config.config.models : [],
    projectScope: config.projectScope,
    projectIds: config.projectIds,
  };
}

const ManualProviderConfig = z.union([
  VertexProviderConfig,
  OpenAICompatibleProviderConfig,
  CloudflareGatewayProviderConfig,
]);

type ConfigDraft = {
  name: string;
  modelScope: AiProviderModelScope;
  modelIds: string[];
  models: ProviderModelConfig[];
  projectScope: AiProviderProjectScope;
  projectIds: string[];
};

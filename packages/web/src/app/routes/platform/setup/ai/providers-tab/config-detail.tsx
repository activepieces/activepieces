import {
  AIProviderModelType,
  AIProviderWithoutSensitiveData,
  AiProviderModelScope,
  AiProviderProjectScope,
  CloudflareGatewayProviderConfig,
  formErrors,
  isNil,
  OpenAICompatibleProviderConfig,
  PlatformModelTier,
  Project,
  ProviderModelConfig,
  UpdateAIProviderRequest,
  VertexProviderConfig,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { KeyRound, RefreshCw, Trash2 } from 'lucide-react';
import { ReactNode, useRef, useState } from 'react';
import { z } from 'zod';

import {
  AdminPageHeader,
  DangerZone,
  SettingsPanel,
  SettingsRow,
  adminPageResources,
} from '@/app/components/admin';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import {
  LeaveWithoutSavingDialog,
  useWarnBeforeLosingChanges,
} from '@/components/custom/leave-without-saving';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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

import { AiCenterTrail } from '../components/ai-center-trail';

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
  initialTab = 'models',
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
  initialTab?: ConfigDetailTab;
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
  const { data: suggestedModelIds = [] } = useQuery({
    queryKey: [...aiProviderKeys.configModels(config.id), 'suggested'],
    queryFn: () => aiProviderApi.listSuggestedModelsForConfig(config.id),
    enabled: manualModels,
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
    statusDetail,
  ]
    .filter(Boolean)
    .join(' · ');
  const nameMissing = draft.name.trim().length === 0;

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
          ? manualModelIdsToSave({
              draft,
              config,
              sendsConfig: !isNil(manualConfig),
            })
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
    <>
      <AdminPageHeader
        title={
          <AiCenterTrail
            crumbs={[{ label: t('Providers'), to: '/platform/ai' }]}
            current={draft.name}
          />
        }
        badge={<KeyStatusBadge status={config.status} />}
        description={
          <span className="flex items-center gap-2">
            <ProviderLogo info={info} size="sm" />
            {metaLine}
          </span>
        }
        resources={adminPageResources.aiProviders}
      >
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
      </AdminPageHeader>

      <Tabs defaultValue={initialTab} className="flex flex-col gap-6">
        <TabsList
          variant="outline"
          className="w-full justify-start border-b border-gray-6"
        >
          <TabsTrigger variant="outline" value="models">
            {t('Models')}
          </TabsTrigger>
          <TabsTrigger variant="outline" value="access">
            {t('Access')}
          </TabsTrigger>
          <TabsTrigger variant="outline" value="settings">
            {t('Settings')}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="models"
          forceMount
          className="mt-0 data-[state=inactive]:hidden"
        >
          {manualModels ? (
            <SettingsPanel flush>
              <PanelHeader
                title={t('Models')}
                description={t('Model ids exposed through this key.')}
              />
              <ManualModelList
                models={draft.models}
                suggestedModelIds={suggestedModelIds}
                tiersByModel={tiersByModel}
                onChange={(models) => setDraft({ ...draft, models })}
              />
            </SettingsPanel>
          ) : (
            <KeyModelList
              config={config}
              models={draft.modelScope === 'all' ? models : selectableModels}
              staleIds={staleIds}
              tiersByModel={tiersByModel}
              selection={{
                modelScope: draft.modelScope,
                modelIds: draft.modelIds,
              }}
              isLoading={isLoadingModels}
              onChange={(selection) => setDraft({ ...draft, ...selection })}
            />
          )}
        </TabsContent>

        <TabsContent
          value="access"
          forceMount
          className="mt-0 data-[state=inactive]:hidden"
        >
          <SettingsPanel flush>
            <PanelHeader
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
              action={
                <ScopeSelect
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
              }
            />
            {draft.projectScope !== 'all' && (
              <ProjectSelectionPanel
                projects={projects}
                selectedIds={draft.projectIds}
                onChange={(projectIds) => setDraft({ ...draft, projectIds })}
              />
            )}
          </SettingsPanel>
        </TabsContent>

        <TabsContent
          value="settings"
          forceMount
          className="mt-0 flex flex-col gap-6 data-[state=inactive]:hidden"
        >
          <SettingsPanel title={t('General')} flush>
            <SettingsRow
              title={<Label htmlFor="config-name">{t('Name')}</Label>}
              description={t('Shown wherever this key is picked.')}
              below={
                nameMissing && (
                  <p className="text-sm text-danger-11">
                    {t(formErrors.required)}
                  </p>
                )
              }
            >
              <Input
                id="config-name"
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
                className="w-64"
                aria-invalid={nameMissing}
              />
            </SettingsRow>
            <SettingsRow
              icon={<KeyRound />}
              title={t('Credentials')}
              description={t('Stored securely')}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={dirty ? 0 : undefined}>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={dirty}
                      onClick={onReplaceCredentials}
                      {...adminControl(
                        AdminControl.AI_PROVIDER_KEY_CREDENTIALS_OPEN,
                      )}
                    >
                      {t('Replace')}
                    </Button>
                  </span>
                </TooltipTrigger>
                {dirty && (
                  <TooltipContent>
                    {t('Save or discard your changes first')}
                  </TooltipContent>
                )}
              </Tooltip>
            </SettingsRow>
          </SettingsPanel>

          <DangerZone>
            <SettingsRow
              title={t('Delete this key')}
              description={t('Flows and agents that use it will fail.')}
            >
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteOpen(true)}
                {...adminControl(AdminControl.AI_PROVIDER_KEY_DELETE_OPEN)}
              >
                <Trash2 className="size-4" />
                {t('Delete')}
              </Button>
            </SettingsRow>
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
          </DangerZone>
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
    </>
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

function PanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 p-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-sm font-semibold text-gray-12">{title}</h2>
        <p className="text-sm text-gray-11">{description}</p>
      </div>
      {action}
    </header>
  );
}

function ScopeSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-44 shrink-0">
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

function draftOf(config: AIProviderWithoutSensitiveData): ConfigDraft {
  const manualModels = providerCredentials.usesManualModels({
    provider: config.provider,
  });
  return {
    name: config.name,
    modelScope: config.modelScope,
    modelIds: manualModels ? [] : config.modelIds,
    models:
      manualModels && 'models' in config.config ? config.config.models : [],
    projectScope: config.projectScope,
    projectIds: config.projectIds,
  };
}

function manualModelIdsToSave({
  draft,
  config,
  sendsConfig,
}: {
  draft: ConfigDraft;
  config: AIProviderWithoutSensitiveData;
  sendsConfig: boolean;
}): string[] {
  const savedModels = 'models' in config.config ? config.config.models : [];
  return draft.models
    .map((model) => model.modelId)
    .filter((modelId) =>
      savedModels.some((model) => model.modelId === modelId)
        ? draft.modelScope === 'all' || config.modelIds.includes(modelId)
        : sendsConfig,
    );
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

export type ConfigDetailTab = 'models' | 'access' | 'settings';

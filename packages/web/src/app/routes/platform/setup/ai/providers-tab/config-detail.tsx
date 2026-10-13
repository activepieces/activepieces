import {
  AIProviderModelType,
  AIProviderWithoutSensitiveData,
  AiProviderModelScope,
  AiProviderProjectScope,
  CloudflareGatewayProviderConfig,
  formErrors,
  OpenAICompatibleProviderConfig,
  Project,
  ProviderModelConfig,
  UpdateAIProviderRequest,
  VertexProviderConfig,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Activity, KeyRound, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { z } from 'zod';

import {
  AdminPageFooter,
  AdminPageHeader,
  AdminSection,
  ConfirmDialog,
  DangerZone,
  SaveBar,
  SettingsPanel,
  SettingsRow,
  adminPageResources,
} from '@/app/components/admin';
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
import { mutationFeedback } from '@/lib/mutation-feedback';

import { KeyStatusBadge } from './key-status';
import { ManualModelList } from './manual-model-list';
import { ModelSelectionPanel } from './model-selection-panel';
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
  const [saveError, setSaveError] = useState<string | null>(null);
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
  const dirty = JSON.stringify(draft) !== JSON.stringify(draftOf(config));
  const statusDetail = [
    config.statusReason,
    config.statusUpdated &&
      t('Last checked {when}', {
        when: formatUtils.formatDateToAgo(new Date(config.statusUpdated)),
      }),
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

  const save = async (): Promise<unknown> => {
    const manualConfigParse = manualModels
      ? ManualProviderConfig.safeParse(config.config)
      : undefined;
    const manualConfig = manualConfigParse?.success
      ? manualConfigParse.data
      : undefined;
    if (nameMissing || saveInFlight.current) {
      return null;
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
      setSaveError(error ? mutationFeedback.message(error) : null);
      return error ?? null;
    } finally {
      saveInFlight.current = false;
    }
  };

  const confirmSave = async () => {
    if (nameMissing) {
      throw mutationFeedback.userError(t('Give this key a name first.'));
    }
    if (saveInFlight.current) {
      throw mutationFeedback.userError(t('A save is already in progress.'));
    }
    const error = await save();
    if (error !== null) {
      throw error;
    }
  };

  return (
    <>
      <AdminPageHeader
        title={draft.name}
        back={{ label: t('Providers'), to: '/platform/ai' }}
        badge={<KeyStatusBadge status={config.status} />}
        description={
          <span className="flex items-center gap-2">
            <ProviderLogo info={info} size="sm" />
            {info.name}
          </span>
        }
        resources={adminPageResources.aiProviders}
      />

      <AdminSection
        title={t('General')}
        description={t('How this key is labelled and authorised.')}
      >
        <SettingsPanel flush>
          <div className="flex flex-col gap-2 px-5 py-4">
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
              <p className="text-sm text-danger-11">{t(formErrors.required)}</p>
            )}
          </div>
          <SettingsRow
            icon={<KeyRound />}
            title={t('Credentials')}
            description={t('Stored securely')}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onReplaceCredentials}
              {...adminControl(AdminControl.AI_PROVIDER_KEY_CREDENTIALS_OPEN)}
            >
              {t('Replace')}
            </Button>
          </SettingsRow>
          <SettingsRow
            icon={<Activity />}
            title={t('Status')}
            description={statusDetail || undefined}
          >
            <Button
              variant="outline"
              size="sm"
              loading={isRechecking}
              onClick={onRecheck}
              {...adminControl(AdminControl.AI_PROVIDER_KEY_RECHECK_RUN)}
            >
              {t('Recheck')}
            </Button>
          </SettingsRow>
        </SettingsPanel>
      </AdminSection>

      <AdminSection
        title={
          <SectionTitle
            title={t('Models')}
            count={isLoadingModels ? undefined : enabledModelCount}
          />
        }
        description={
          manualModels
            ? t('Model ids exposed through this key.')
            : t('Which of this key’s models the platform may use.')
        }
        action={
          manualModels ? undefined : (
            <ScopeTabs
              value={draft.modelScope}
              onChange={(value) =>
                setDraft({
                  ...draft,
                  modelScope: value === 'all' ? 'all' : 'selected',
                  modelIds: value === 'all' ? [] : draft.modelIds,
                })
              }
              options={[
                { value: 'all', label: t('All models') },
                { value: 'selected', label: t('Only selected') },
              ]}
            />
          )
        }
      >
        {manualModels ? (
          <ManualModelList
            models={draft.models}
            suggestedModelIds={suggestedModelIds}
            onChange={(models) => setDraft({ ...draft, models })}
          />
        ) : (
          draft.modelScope === 'selected' && (
            <ModelSelectionPanel
              models={selectableModels}
              selectedIds={draft.modelIds}
              isLoading={isLoadingModels}
              onChange={(modelIds) => setDraft({ ...draft, modelIds })}
            />
          )
        )}
      </AdminSection>

      <AdminSection
        title={
          <SectionTitle
            title={t('Project access')}
            count={allowedProjectCount}
          />
        }
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
        }
      >
        {draft.projectScope !== 'all' && (
          <ProjectSelectionPanel
            projects={projects}
            selectedIds={draft.projectIds}
            onChange={(projectIds) => setDraft({ ...draft, projectIds })}
          />
        )}
      </AdminSection>

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
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={t('Delete {name}?', { name: config.name })}
          description={t('Flows and agents that use this key will fail.')}
          confirmLabel={t('Delete key')}
          controlId={AdminControl.AI_PROVIDER_KEY_DELETE_CONFIRM}
          onConfirm={async () => {
            await onDelete();
            leavingOnPurpose.current = true;
            onBack();
          }}
        />
      </DangerZone>

      <AdminPageFooter>
        <SaveBar
          width="content"
          dirty={dirty}
          saving={isSaving}
          disabled={nameMissing}
          error={saveError}
          onSave={requestSave}
          onDiscard={() => {
            setDraft(draftOf(config));
            setSaveError(null);
          }}
          canDiscard={dirty || saveError !== null}
          standDown={leavingOnPurpose}
          guardSearchChanges
          saveControl={AdminControl.AI_PROVIDER_KEY_SETTINGS_SUBMIT}
        />
      </AdminPageFooter>

      <ConfirmDialog
        open={scopeImpact.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setScopeImpact([]);
          }
        }}
        title={t('Change which projects can use {name}?', {
          name: config.name,
        })}
        description={
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {scopeImpact.map((impact) => (
              <li key={impact.tierName}>{scopeImpactText(impact)}</li>
            ))}
          </ul>
        }
        confirmLabel={t('Save anyway')}
        destructive={false}
        onConfirm={confirmSave}
      />
    </>
  );
}

function SectionTitle({ title, count }: { title: string; count?: number }) {
  return (
    <span className="flex items-baseline gap-2">
      {title}
      {count !== undefined && (
        <span className="text-sm font-normal tabular-nums text-gray-11">
          {count}
        </span>
      )}
    </span>
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

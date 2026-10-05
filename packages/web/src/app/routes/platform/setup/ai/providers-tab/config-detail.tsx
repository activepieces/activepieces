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
import { Activity, KeyRound } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { z } from 'zod';

import { UnsavedChangesGuard } from '@/components/custom/leave-without-saving';
import { listFormat } from '@/components/custom/list/list-format';
import {
  Page,
  PageColumns,
  PageHeader,
  PageSection,
} from '@/components/custom/page';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { DangerZone, SaveBar } from '@/components/custom/settings-parts';
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
import { aiProviderApi, aiProviderKeys } from '@/features/platform-admin';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { TitleWithCount } from '../components/title-with-count';

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
  saveError,
  onSave,
  onDelete,
  onReplaceCredentials,
  isRechecking,
  onRecheck,
  onDiscard,
  leavingOnPurpose,
}: {
  config: AIProviderWithoutSensitiveData;
  info: AiProviderInfo;
  projects: Project[];
  isSaving: boolean;
  saveError?: string | null;
  onSave: (request: UpdateAIProviderRequest) => Promise<unknown>;
  onDelete: () => void;
  onReplaceCredentials: () => void;
  isRechecking: boolean;
  onRecheck: () => void;
  onDiscard?: () => void;
  leavingOnPurpose?: React.RefObject<boolean>;
}) {
  const neverLeavingOnPurpose = useRef(false);
  const saved = draftOf(config);
  const [draft, setDraft] = useState<ConfigDraft>(saved);
  const [base, setBase] = useState<ConfigDraft>(saved);
  const saveInFlight = useRef(false);
  if (!sameDraft(base, saved)) {
    setBase(saved);
    setDraft(rebaseDraft({ draft, base, saved }));
  }

  const manualModels = providerCredentials.usesManualModels({
    provider: config.provider,
  });
  const {
    data: models = [],
    isLoading: isLoadingModels,
    isError: isModelsError,
    refetch: refetchModels,
  } = useQuery({
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
  const dirty = !sameDraft(draft, saved);
  const statusDetail = config.statusReason;
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

  const save = async () => {
    const manualConfigParse = manualModels
      ? ManualProviderConfig.safeParse(config.config)
      : undefined;
    const manualConfig = manualConfigParse?.success
      ? manualConfigParse.data
      : undefined;
    if (nameMissing || isSaving || saveInFlight.current) {
      return;
    }
    saveInFlight.current = true;
    try {
      await onSave({
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
    } finally {
      saveInFlight.current = false;
    }
  };

  const keyPanel = (
    <Panel flush title={t('Key')}>
      <SettingRows>
        <SettingRow
          title={<Label htmlFor="config-name">{t('Name')}</Label>}
          description={
            nameMissing ? (
              <span className="text-danger-11">{t(formErrors.required)}</span>
            ) : undefined
          }
        >
          <Input
            id="config-name"
            value={draft.name}
            onChange={(event) =>
              setDraft({ ...draft, name: event.target.value })
            }
            className="w-40"
            aria-invalid={nameMissing}
          />
        </SettingRow>
        <SettingRow
          icon={<KeyRound />}
          title={t('Credentials')}
          description={t('Stored encrypted')}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onReplaceCredentials}
            {...adminControl(AdminControl.AI_PROVIDER_KEY_CREDENTIALS_OPEN)}
          >
            {t('Replace')}
          </Button>
        </SettingRow>
        <SettingRow
          icon={<Activity />}
          title={t('Status')}
          description={
            <span className="flex flex-col gap-1">
              <KeyStatusBadge status={config.status} />
              {statusDetail && <span>{statusDetail}</span>}
            </span>
          }
          className="items-start"
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
        </SettingRow>
      </SettingRows>
    </Panel>
  );

  return (
    <Page
      footer={
        dirty || saveError ? (
          <form
            className="contents"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <SaveBar
              dirty={dirty}
              saving={isSaving}
              invalid={nameMissing}
              error={saveError}
              onDiscard={() => {
                setDraft(saved);
                onDiscard?.();
              }}
              saveControl={AdminControl.AI_PROVIDER_KEY_SETTINGS_SUBMIT}
            />
          </form>
        ) : undefined
      }
    >
      <PageHeader
        back={{ label: t('AI providers'), to: '/platform/ai' }}
        title={
          <span className="flex min-w-0 items-center gap-3">
            <ProviderLogo info={info} />
            <span className="truncate">{config.name}</span>
          </span>
        }
        description={[
          info.name,
          config.enabledForChat ? t('Runs chat') : null,
          config.statusUpdated
            ? t('Checked {when}', {
                when: listFormat
                  .relativeDate(config.statusUpdated)
                  .toLowerCase(),
              })
            : null,
        ]
          .filter((part) => part !== null)
          .join(' · ')}
      />

      <PageColumns
        main={
          <>
            <PageSection
              className="mt-0"
              title={
                <TitleWithCount
                  title={t('Models')}
                  count={
                    isLoadingModels || isModelsError
                      ? undefined
                      : enabledModelCount
                  }
                />
              }
              description={
                manualModels
                  ? t('Model ids exposed through this key.')
                  : t('Which of this key’s models the platform may use.')
              }
              action={
                !manualModels && (
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
                  onChange={(models) => setDraft({ ...draft, models })}
                />
              ) : (
                draft.modelScope === 'selected' && (
                  <ModelSelectionPanel
                    models={selectableModels}
                    selectedIds={draft.modelIds}
                    isLoading={isLoadingModels}
                    isError={isModelsError}
                    onRetry={refetchModels}
                    onChange={(modelIds) => setDraft({ ...draft, modelIds })}
                  />
                )
              )}
            </PageSection>

            <PageSection
              title={
                <TitleWithCount
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
            </PageSection>
          </>
        }
        aside={
          <>
            {keyPanel}
            <DangerZone
              actions={[
                {
                  title: t('Delete this key'),
                  description: t('Steps and agents using it stop working.'),
                  control: (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-danger-11 hover:text-danger-11"
                      onClick={onDelete}
                      {...adminControl(
                        AdminControl.AI_PROVIDER_KEY_DELETE_OPEN,
                      )}
                    >
                      {t('Delete')}
                    </Button>
                  ),
                },
              ]}
            />
          </>
        }
      />

      <UnsavedChangesGuard
        dirty={dirty}
        standDown={leavingOnPurpose ?? neverLeavingOnPurpose}
        blockSearchChanges
      />
    </Page>
  );
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

function sameDraft(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function rebaseDraft({
  draft,
  base,
  saved,
}: {
  draft: ConfigDraft;
  base: ConfigDraft;
  saved: ConfigDraft;
}): ConfigDraft {
  const pick = <K extends keyof ConfigDraft>(key: K): ConfigDraft[K] =>
    sameDraft(draft[key], base[key]) ? saved[key] : draft[key];
  return {
    name: pick('name'),
    modelScope: pick('modelScope'),
    modelIds: pick('modelIds'),
    models: pick('models'),
    projectScope: pick('projectScope'),
    projectIds: pick('projectIds'),
  };
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

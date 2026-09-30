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

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import {
  LeaveWithoutSavingDialog,
  useWarnBeforeLosingChanges,
} from '@/components/custom/leave-without-saving';
import { Page, PageHeader, PageSection } from '@/components/custom/page';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
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
import { formatUtils } from '@/lib/format-utils';

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
  onSave: (request: UpdateAIProviderRequest) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
  onReplaceCredentials: () => void;
  isRechecking: boolean;
  onRecheck: () => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState<ConfigDraft>(draftOf(config));
  const [deleteOpen, setDeleteOpen] = useState(false);
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
    if (nameMissing || saveInFlight.current) {
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

  return (
    <Page
      width="narrow"
      footer={
        dirty ? (
          <>
            <span className="text-sm text-gray-11">
              {t('You have unsaved changes')}
            </span>
            <Button variant="outline" onClick={() => setDraft(draftOf(config))}>
              {t('Discard')}
            </Button>
            <Button
              loading={isSaving}
              disabled={nameMissing || isSaving}
              keyboardShortcut="S"
              onKeyboardShortcut={save}
              onClick={save}
            >
              {t('Save')}
            </Button>
          </>
        ) : undefined
      }
    >
      <PageHeader
        back={{ label: t('Providers'), onClick: onBack }}
        title={
          <span className="flex min-w-0 items-center gap-3">
            <ProviderLogo info={info} />
            <span className="truncate">{draft.name}</span>
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-2">
            {info.name}
            <KeyStatusBadge status={config.status} />
          </span>
        }
      />

      <PageSection
        title={t('General')}
        description={t('How this key is labelled and authorised.')}
      >
        <Panel flush>
          <SettingRows>
            <SettingRow
              title={<Label htmlFor="config-name">{t('Name')}</Label>}
              description={
                nameMissing ? (
                  <span className="text-danger-11">
                    {t(formErrors.required)}
                  </span>
                ) : undefined
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
            </SettingRow>
            <Item>
              <ItemMedia variant="icon">
                <KeyRound className="text-gray-11" />
              </ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle>{t('Credentials')}</ItemTitle>
                <ItemDescription className="truncate">
                  {t('Stored securely')}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReplaceCredentials}
                >
                  {t('Replace')}
                </Button>
              </ItemActions>
            </Item>
            <Item>
              <ItemMedia variant="icon">
                <Activity className="text-gray-11" />
              </ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle>{t('Status')}</ItemTitle>
                {statusDetail && (
                  <ItemDescription>{statusDetail}</ItemDescription>
                )}
              </ItemContent>
              <ItemActions>
                <Button
                  variant="outline"
                  size="sm"
                  loading={isRechecking}
                  onClick={onRecheck}
                >
                  {t('Recheck')}
                </Button>
              </ItemActions>
            </Item>
          </SettingRows>
        </Panel>
      </PageSection>

      <PageSection
        title={
          <TitleWithCount
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

      <PageSection
        title={t('Danger zone')}
        description={t('Irreversible actions for this key.')}
      >
        <Panel flush>
          <SettingRows>
            <SettingRow
              title={t('Delete this key')}
              description={t('Steps and agents using it will stop working.')}
            >
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 />
                {t('Delete')}
              </Button>
            </SettingRow>
          </SettingRows>
        </Panel>
        <ConfirmationDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={t('Delete {name}', { name: config.name })}
          message={t('Steps and agents using this key will stop working.')}
          entityName={config.name}
          showToast={true}
          mutationFn={async () => {
            await onDelete();
            leavingOnPurpose.current = true;
            onBack();
          }}
        />
      </PageSection>

      <LeaveWithoutSavingDialog
        open={leaveBlocker.state === 'blocked'}
        onKeepEditing={() => leaveBlocker.reset?.()}
        onDiscard={() => leaveBlocker.proceed?.()}
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

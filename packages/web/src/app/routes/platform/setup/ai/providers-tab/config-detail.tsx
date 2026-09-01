import {
  AIProviderModelType,
  AIProviderWithoutSensitiveData,
  AiProviderModelScope,
  AiProviderProjectScope,
  CloudflareGatewayProviderConfig,
  formErrors,
  OpenAICompatibleProviderConfig,
  Project,
  UpdateAIProviderRequest,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Activity, ChevronLeft, KeyRound, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
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
import { formatUtils } from '@/lib/format-utils';

import { SectionHeader } from '../components/section-header';

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
  onSave: (request: UpdateAIProviderRequest) => void;
  onDelete: () => void;
  onReplaceCredentials: () => void;
  isRechecking: boolean;
  onRecheck: () => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState<ConfigDraft>(draftOf(config));
  const [deleteOpen, setDeleteOpen] = useState(false);

  const manualModels = providerCredentials.usesManualModels({
    provider: config.provider,
  });
  const { data: models = [] } = useQuery({
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
  const statusDetail = [
    config.statusReason,
    config.statusUpdated &&
      t('Last checked {when}', {
        when: formatUtils.formatDateTime(new Date(config.statusUpdated)),
      }),
  ]
    .filter(Boolean)
    .join(' · ');
  const nameMissing = draft.name.trim().length === 0;
  const enabledModelCount =
    !manualModels && draft.modelScope === 'all'
      ? models.length
      : draft.modelIds.length;
  const allowedProjectCount =
    draft.projectScope === 'all'
      ? projects.length
      : draft.projectScope === 'except'
      ? projects.length - draft.projectIds.length
      : draft.projectIds.length;

  const save = () => {
    const manualConfigParse = manualModels
      ? ManualProviderConfig.safeParse(config.config)
      : undefined;
    const manualConfig = manualConfigParse?.success
      ? manualConfigParse.data
      : undefined;
    if (nameMissing) {
      return;
    }
    onSave({
      displayName: draft.name.trim(),
      modelScope: draft.modelScope,
      modelIds: draft.modelIds,
      projectScope: draft.projectScope,
      projectIds: draft.projectIds,
      ...(manualConfig
        ? {
            config: {
              ...manualConfig,
              models: draft.modelIds.map(
                (modelId) =>
                  manualConfig.models.find(
                    (model) => model.modelId === modelId,
                  ) ?? {
                    modelId,
                    modelName: modelId,
                    modelType: AIProviderModelType.TEXT,
                  },
              ),
            },
          }
        : {}),
    });
  };

  return (
    <div className="flex flex-col gap-8 pb-20">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          {t('Providers')}
        </button>
        <div className="flex items-start gap-3">
          <ProviderLogo info={info} />
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate text-lg font-semibold leading-none tracking-tight">
              {draft.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{info.name}</span>
              <KeyStatusBadge status={config.status} />
            </div>
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <SectionHeader
          title={t('General')}
          description={t('How this key is labelled and authorised.')}
        />
        <div className="flex flex-col divide-y divide-border/60 rounded-xl border border-border/60">
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
              <p className="text-sm text-destructive">
                {t(formErrors.required)}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                <KeyRound className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-none">
                  {t('Credentials')}
                </p>
                <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                  {t('Stored securely')}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onReplaceCredentials}>
              {t('Replace')}
            </Button>
          </div>
          <div className="flex items-center justify-between gap-3 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                <Activity className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-none">
                  {t('Status')}
                </p>
                {statusDetail && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {statusDetail}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              loading={isRechecking}
              onClick={onRecheck}
            >
              {t('Recheck')}
            </Button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHeader
            title={t('Models')}
            count={enabledModelCount}
            description={
              manualModels
                ? t('Model ids exposed through this key.')
                : t('Which of this key’s models the platform may use.')
            }
          />
          {!manualModels && (
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
          )}
        </div>
        {manualModels ? (
          <ManualModelList
            modelIds={draft.modelIds}
            onChange={(modelIds) => setDraft({ ...draft, modelIds })}
          />
        ) : (
          draft.modelScope === 'selected' && (
            <ModelSelectionPanel
              models={selectableModels}
              selectedIds={draft.modelIds}
              onChange={(modelIds) => setDraft({ ...draft, modelIds })}
            />
          )
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHeader
            title={t('Project access')}
            count={allowedProjectCount}
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
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader
          title={t('Danger zone')}
          description={t('Irreversible actions for this key.')}
        />
        <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium leading-none">
              {t('Delete this key')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('Steps and agents using it will stop working.')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            {t('Delete')}
          </Button>
        </div>
        <ConfirmationDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={t('Delete {name}', { name: config.name })}
          message={t('Steps and agents using this key will stop working.')}
          entityName={config.name}
          mutationFn={async () => onDelete()}
        />
      </section>

      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-4">
          <div className="flex items-center gap-3 rounded-xl border bg-background px-4 py-2.5 shadow-lg">
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
              disabled={nameMissing}
              onClick={save}
            >
              {t('Save')}
            </Button>
          </div>
        </div>
      )}
    </div>
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
    modelIds:
      manualModels && 'models' in config.config
        ? config.config.models.map((model) => model.modelId)
        : config.modelIds,
    projectScope: config.projectScope,
    projectIds: config.projectIds,
  };
}

const ManualProviderConfig = z.union([
  OpenAICompatibleProviderConfig,
  CloudflareGatewayProviderConfig,
]);

type ConfigDraft = {
  name: string;
  modelScope: AiProviderModelScope;
  modelIds: string[];
  projectScope: AiProviderProjectScope;
  projectIds: string[];
};

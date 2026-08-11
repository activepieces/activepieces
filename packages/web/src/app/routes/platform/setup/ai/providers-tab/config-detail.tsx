import { t } from 'i18next';
import {
  BookOpen,
  ChevronLeft,
  ExternalLink,
  KeyRound,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AiProviderInfo } from '@/features/agents';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { SectionHeader } from '../components/section-header';
import {
  MockProject,
  MockProviderConfig,
  MODEL_CATALOG,
  PROVIDER_USAGE_DASHBOARDS,
} from '../mock/fixtures';

import { ManualModelList } from './manual-model-list';
import { ModelSelectionPanel } from './model-selection-panel';
import { ProjectSelectionPanel } from './project-selection-panel';
import { providerCredentials } from './provider-credentials';
import { ProviderLogo } from './provider-logo';

export function ConfigDetail({
  config,
  info,
  projects,
  onSave,
  onDelete,
  onReplaceCredentials,
  onBack,
}: {
  config: MockProviderConfig;
  info: AiProviderInfo;
  projects: MockProject[];
  onSave: (config: MockProviderConfig) => void;
  onDelete: () => void;
  onReplaceCredentials: () => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState(config);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const models = MODEL_CATALOG.filter(
    (model) => model.provider === config.provider,
  );
  const manualModels = providerCredentials.usesManualModels({
    provider: config.provider,
  });
  const dirty = JSON.stringify(draft) !== JSON.stringify(config);
  const usageDashboardUrl = PROVIDER_USAGE_DASHBOARDS[config.provider];
  const monitorGuideUrl = `https://www.activepieces.com/docs/ai/monitor-usage/${config.provider}`;
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
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    config.down ? 'bg-destructive' : 'bg-success-500',
                  )}
                />
                {config.down ? t('Unreachable') : t('Active')}
              </span>
              {config.lastUsedAt && (
                <>
                  <span aria-hidden>·</span>
                  <span>
                    {t('used')}{' '}
                    {formatUtils.formatDate(new Date(config.lastUsedAt))}
                  </span>
                </>
              )}
              {usageDashboardUrl && (
                <ExternalLinkChip
                  href={usageDashboardUrl}
                  icon={<ExternalLink className="size-3" />}
                  label={t('Usage dashboard')}
                />
              )}
              <ExternalLinkChip
                href={monitorGuideUrl}
                icon={<BookOpen className="size-3" />}
                label={t('Monitoring guide')}
              />
            </div>
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <SectionHeader
          title={t('General')}
          description={t('How this configuration is labelled and authorised.')}
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
            />
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
                  {providerCredentials.summaryOf({
                    provider: config.provider,
                    credentials: config.credentials,
                  })}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onReplaceCredentials}>
              {t('Replace')}
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
                ? t('Model ids exposed through this configuration.')
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
              models={models}
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
                ? t('Only these projects can use this configuration.')
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
          description={t('Irreversible actions for this configuration.')}
        />
        <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium leading-none">
              {t('Delete this configuration')}
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
          message={t(
            'Steps and agents using this configuration will stop working.',
          )}
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
              onClick={() => setDraft(config)}
            >
              {t('Discard')}
            </Button>
            <Button size="sm" onClick={() => onSave(draft)}>
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
    <Tabs value={value} onValueChange={onChange} className="shrink-0">
      <TabsList>
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value}>
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function ExternalLinkChip({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
    >
      {icon}
      {label}
    </a>
  );
}

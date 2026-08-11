import { AIProviderName } from '@activepieces/core-utils';
import { apId } from '@activepieces/shared';
import { t } from 'i18next';
import {
  Copy,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Settings2,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AiProviderInfo, SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { SectionHeader } from '../components/section-header';
import {
  MockProject,
  MockProviderConfig,
  MODEL_CATALOG,
} from '../mock/fixtures';

import { ConfigDetail } from './config-detail';
import { ConnectProviderDialog } from './connect-provider-dialog';
import { ProjectSwatch } from './project-selection-panel';
import { ProviderLogo } from './provider-logo';

export function ProvidersTab({
  projects,
  configs,
  onConfigsChange,
  chatProvider,
  onChatProviderChange,
}: {
  projects: MockProject[];
  configs: MockProviderConfig[];
  onConfigsChange: (configs: MockProviderConfig[]) => void;
  chatProvider: AIProviderName | null;
  onChatProviderChange: (provider: AIProviderName) => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MockProviderConfig | undefined>(
    undefined,
  );
  const [dialogProvider, setDialogProvider] = useState<
    AIProviderName | undefined
  >(undefined);

  const openConfig = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('config', id);
    setSearchParams(next);
  };
  const closeConfig = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('config');
    setSearchParams(next);
  };
  const openConnect = (provider?: AIProviderName) => {
    setEditing(undefined);
    setDialogProvider(provider);
    setDialogOpen(true);
  };
  const openReplaceCredentials = (config: MockProviderConfig) => {
    setEditing(config);
    setDialogProvider(undefined);
    setDialogOpen(true);
  };
  const saveConfig = (config: MockProviderConfig) => {
    onConfigsChange(
      configs.some((candidate) => candidate.id === config.id)
        ? configs.map((candidate) =>
            candidate.id === config.id ? config : candidate,
          )
        : [...configs, config],
    );
  };
  const onConnected = (config: MockProviderConfig) => {
    saveConfig(config);
    if (!configs.some((candidate) => candidate.id === config.id)) {
      openConfig(config.id);
    }
  };
  const duplicateConfig = (config: MockProviderConfig) => {
    onConfigsChange([
      ...configs,
      {
        ...config,
        id: apId(),
        name: t('{name} (copy)', { name: config.name }),
        lastUsedAt: undefined,
      },
    ]);
  };
  const deleteConfig = (id: string) => {
    onConfigsChange(configs.filter((config) => config.id !== id));
  };

  const connectedProviders = [...new Set(configs.map((c) => c.provider))];
  const available = SUPPORTED_AI_PROVIDERS.filter(
    ({ provider }) => !connectedProviders.includes(provider),
  );

  const activeConfig = configs.find(
    (config) => config.id === searchParams.get('config'),
  );
  const activeInfo = activeConfig
    ? providerInfoOf({ provider: activeConfig.provider })
    : undefined;
  if (activeConfig && activeInfo) {
    return (
      <>
        <ConfigDetail
          key={activeConfig.id}
          config={activeConfig}
          info={activeInfo}
          projects={projects}
          onSave={saveConfig}
          onDelete={() => {
            deleteConfig(activeConfig.id);
            closeConfig();
          }}
          onReplaceCredentials={() => openReplaceCredentials(activeConfig)}
          onBack={closeConfig}
        />
        <ConnectProviderDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editing={editing}
          defaultProvider={dialogProvider}
          onConnected={onConnected}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-3">
          <SectionHeader
            title={t('Providers')}
            count={configs.length}
            description={
              configs.length === 0
                ? t(
                    'Connect a provider to turn on chat, agents, and AI steps across your platform.',
                  )
                : t(
                    'Each configuration is one API key with its own models and projects.',
                  )
            }
          />
          <Button size="sm" className="shrink-0" onClick={() => openConnect()}>
            <Plus className="size-4" />
            {t('Add configuration')}
          </Button>
        </div>

        {configs.length === 0 ? (
          <EmptyProviders onConnect={openConnect} />
        ) : (
          <>
            {configs.some((config) => config.down) && (
              <AttentionBanner
                configs={configs.filter((config) => config.down)}
              />
            )}
            <ChatProviderRow
              providers={connectedProviders}
              value={chatProvider}
              onChange={onChatProviderChange}
            />
            <div className="flex flex-col gap-6">
              {connectedProviders.map((provider) => (
                <ProviderGroup
                  key={provider}
                  provider={provider}
                  configs={configs.filter(
                    (config) => config.provider === provider,
                  )}
                  projects={projects}
                  onAdd={() => openConnect(provider)}
                  onOpen={openConfig}
                  onDuplicate={duplicateConfig}
                  onDelete={deleteConfig}
                />
              ))}
            </div>
            {available.length > 0 && (
              <section className="flex flex-col gap-4 border-t border-border/60 pt-6">
                <SectionHeader
                  title={t('Also available')}
                  count={available.length}
                  description={t(
                    'Bring your own API key to connect any of these.',
                  )}
                />
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {available.map((info) => (
                    <AvailableProviderCard
                      key={info.provider}
                      info={info}
                      onConnect={() => openConnect(info.provider)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <ConnectProviderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        defaultProvider={dialogProvider}
        onConnected={onConnected}
      />
    </>
  );
}

function ProviderGroup({
  provider,
  configs,
  projects,
  onAdd,
  onOpen,
  onDuplicate,
  onDelete,
}: {
  provider: AIProviderName;
  configs: MockProviderConfig[];
  projects: MockProject[];
  onAdd: () => void;
  onOpen: (id: string) => void;
  onDuplicate: (config: MockProviderConfig) => void;
  onDelete: (id: string) => void;
}) {
  const info = providerInfoOf({ provider });
  if (!info) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border/60">
      <div className="flex items-center gap-3 border-b border-border/60 bg-muted/30 px-4 py-3">
        <ProviderLogo info={info} />
        <p className="flex-1 text-sm font-medium">{info.name}</p>
        <Button variant="ghost" size="sm" onClick={onAdd}>
          <Plus className="size-4" />
          {t('Add configuration')}
        </Button>
      </div>
      {configs.map((config) => (
        <ConfigRow
          key={config.id}
          config={config}
          projects={projects}
          onOpen={() => onOpen(config.id)}
          onDuplicate={() => onDuplicate(config)}
          onDelete={() => onDelete(config.id)}
        />
      ))}
    </section>
  );
}

function ConfigRow({
  config,
  projects,
  onOpen,
  onDuplicate,
  onDelete,
}: {
  config: MockProviderConfig;
  projects: MockProject[];
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const providerModels = MODEL_CATALOG.filter(
    (model) => model.provider === config.provider,
  );
  const selectedModelNames =
    config.modelScope === 'all'
      ? providerModels.map((model) => model.name)
      : config.modelIds.map(
          (modelId) =>
            providerModels.find((model) => model.id === modelId)?.name ??
            modelId,
        );
  const namedProjects = projects.filter((project) =>
    config.projectIds.includes(project.id),
  );
  const allowedProjectCount =
    config.projectScope === 'except'
      ? projects.length - namedProjects.length
      : namedProjects.length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      className="flex cursor-pointer items-center gap-4 border-b border-border/60 px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/20"
    >
      <div className="flex min-w-0 flex-[2] flex-col gap-1">
        <p className="truncate text-sm font-medium leading-none">
          {config.name}
        </p>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={cn(
              'size-1.5 rounded-full',
              config.down ? 'bg-destructive' : 'bg-success-500',
            )}
          />
          {config.down ? t('Unreachable') : t('Active')}
          {config.lastUsedAt && (
            <>
              <span aria-hidden>·</span>
              {t('used')} {formatUtils.formatDate(new Date(config.lastUsedAt))}
            </>
          )}
        </span>
      </div>

      <SummaryCell
        label={
          config.modelScope === 'all'
            ? t('All models')
            : t('{count} models', { count: selectedModelNames.length })
        }
        items={selectedModelNames}
      />

      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {config.projectScope === 'all' ? (
          <span className="truncate text-sm text-muted-foreground">
            {t('All projects')}
          </span>
        ) : (
          <ProjectChips
            projects={namedProjects}
            excluded={config.projectScope === 'except'}
            allowedCount={allowedProjectCount}
          />
        )}
      </div>

      <div onClick={(event) => event.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="px-2">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onOpen}>
              <Settings2 className="size-4" />
              {t('Configure')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="size-4" />
              {t('Duplicate')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteOpen(true)}
              className="text-destructive"
            >
              <Trash2 className="size-4" />
              {t('Delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
      </div>
    </div>
  );
}

function SummaryCell({ label, items }: { label: string; items: string[] }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{items.join(', ')}</TooltipContent>
    </Tooltip>
  );
}

function ProjectChips({
  projects,
  excluded,
  allowedCount,
}: {
  projects: MockProject[];
  excluded: boolean;
  allowedCount: number;
}) {
  const shown = projects.slice(0, 3);
  const rest = projects.length - shown.length;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex min-w-0 items-center gap-1">
          {excluded && (
            <span className="shrink-0 text-sm text-muted-foreground">
              {t('All except')}
            </span>
          )}
          {shown.map((project) => (
            <ProjectSwatch key={project.id} project={project} />
          ))}
          {rest > 0 && (
            <span className="text-sm text-muted-foreground tabular-nums">
              {t('+{count}', { count: rest })}
            </span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        {excluded
          ? t('{count} projects have access. Excluded: {names}', {
              count: allowedCount,
              names: projects.map((project) => project.name).join(', '),
            })
          : projects.map((project) => project.name).join(', ')}
      </TooltipContent>
    </Tooltip>
  );
}

function AttentionBanner({ configs }: { configs: MockProviderConfig[] }) {
  const names = configs.map((config) => config.name).join(', ');
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5">
      <TriangleAlert className="size-4 shrink-0 text-destructive" />
      <p className="text-sm">
        {configs.length === 1
          ? t('{names} is unreachable — steps using it will fail.', { names })
          : t('{names} are unreachable — steps using them will fail.', {
              names,
            })}
      </p>
    </div>
  );
}

function ChatProviderRow({
  providers,
  value,
  onChange,
}: {
  providers: AIProviderName[];
  value: AIProviderName | null;
  onChange: (provider: AIProviderName) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/60">
        <MessageSquare className="size-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-none">{t('Chat provider')}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('Powers the built-in chat for everyone on this platform')}
        </p>
      </div>
      <Select
        value={value ?? undefined}
        onValueChange={(selected) => onChange(selected as AIProviderName)}
      >
        <SelectTrigger className="w-52 rounded-lg">
          <SelectValue placeholder={t('Select provider')} />
        </SelectTrigger>
        <SelectContent>
          {providers.map((provider) => {
            const info = providerInfoOf({ provider });
            return (
              <SelectItem key={provider} value={provider}>
                <div className="flex items-center gap-2">
                  {info && <ProviderLogo info={info} size="sm" />}
                  <span>{info?.name ?? provider}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

function EmptyProviders({
  onConnect,
}: {
  onConnect: (provider: AIProviderName) => void;
}) {
  const recommended = RECOMMENDED_PROVIDERS.map((provider) =>
    SUPPORTED_AI_PROVIDERS.find((info) => info.provider === provider),
  ).filter((info): info is AiProviderInfo => info !== undefined);
  const others = SUPPORTED_AI_PROVIDERS.filter(
    ({ provider }) => !RECOMMENDED_PROVIDERS.includes(provider),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {recommended.map((info) => (
          <AvailableProviderCard
            key={info.provider}
            info={info}
            tagline={RECOMMENDED_TAGLINES[info.provider]}
            recommended
            onConnect={() => onConnect(info.provider)}
          />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          {t('Or choose another provider')}
        </p>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {others.map((info) => (
            <AvailableProviderCard
              key={info.provider}
              info={info}
              onConnect={() => onConnect(info.provider)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AvailableProviderCard({
  info,
  tagline,
  recommended,
  onConnect,
}: {
  info: AiProviderInfo;
  tagline?: string;
  recommended?: boolean;
  onConnect: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border">
      <ProviderLogo info={info} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm font-medium leading-none">{info.name}</p>
        {tagline && (
          <p className="truncate text-xs text-muted-foreground">{tagline}</p>
        )}
      </div>
      <Button
        size="sm"
        variant={recommended ? 'default' : 'outline'}
        onClick={onConnect}
      >
        {t('Connect')}
      </Button>
    </div>
  );
}

function providerInfoOf({
  provider,
}: {
  provider: AIProviderName;
}): AiProviderInfo | undefined {
  return SUPPORTED_AI_PROVIDERS.find(
    (candidate) => candidate.provider === provider,
  );
}

const RECOMMENDED_PROVIDERS: AIProviderName[] = [
  AIProviderName.ANTHROPIC,
  AIProviderName.OPENAI,
];

const RECOMMENDED_TAGLINES: Partial<Record<AIProviderName, string>> = {
  [AIProviderName.ANTHROPIC]: t('Claude models — strong for chat and agents'),
  [AIProviderName.OPENAI]: t('GPT models — broad ecosystem and tooling'),
};

import { AIProviderName } from '@activepieces/core-utils';
import { apId, ColorName, ProjectType } from '@activepieces/shared';
import { t } from 'i18next';
import {
  BookOpen,
  ExternalLink,
  MessageSquare,
  Plus,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AiProviderInfo, SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import {
  MODEL_CATALOG,
  MockProviderKey,
  MockScenario,
  PROVIDER_USAGE_DASHBOARDS,
} from '../mock/fixtures';

import { AddKeyDialog } from './add-key-dialog';
import {
  ProviderConfig,
  ProviderDetail,
  ProjectOption,
} from './provider-detail';

export function ProvidersTab({ scenario }: { scenario: MockScenario }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [chatProvider, setChatProvider] = useState(scenario.chatProvider);
  const projects: ProjectOption[] = scenario.usage.map((usage, index) => ({
    id: usage.projectId,
    name: usage.projectName,
    color: PROJECT_COLORS[index % PROJECT_COLORS.length],
    type: ProjectType.TEAM,
  }));
  const [keys, setKeys] = useState<MockProviderKey[]>(() => scenario.keys);
  const [configByKey, setConfigByKey] = useState<
    Record<string, ProviderConfig>
  >(() => initConfigs({ keys: scenario.keys, projects }));
  const [addKeyOpen, setAddKeyOpen] = useState(false);
  const [addKeyProvider, setAddKeyProvider] = useState<
    AIProviderName | undefined
  >(undefined);

  const openKey = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('key', id);
    setSearchParams(next);
  };
  const closeKey = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('key');
    setSearchParams(next);
  };
  const openAddKey = (provider?: AIProviderName) => {
    setAddKeyProvider(provider);
    setAddKeyOpen(true);
  };
  const createKey = ({
    provider,
    name,
  }: {
    provider: AIProviderName;
    name: string;
  }) => {
    const id = apId();
    setKeys((current) => [...current, { id, provider, name }]);
    setConfigByKey((current) => ({
      ...current,
      [id]: {
        enabledModelIds: new Set(
          MODEL_CATALOG.filter((model) => model.provider === provider).map(
            (model) => model.id,
          ),
        ),
        scope: 'all',
        selectedProjectIds: new Set(),
      },
    }));
    setAddKeyOpen(false);
    openKey(id);
  };

  const activeKey = keys.find((key) => key.id === searchParams.get('key'));
  const activeInfo = activeKey
    ? providerInfoOf({ provider: activeKey.provider })
    : undefined;
  if (activeKey && activeInfo) {
    return (
      <ProviderDetail
        keyName={activeKey.name}
        info={activeInfo}
        down={activeKey.down}
        usageDashboardUrl={PROVIDER_USAGE_DASHBOARDS[activeKey.provider]}
        monitorGuideUrl={`https://www.activepieces.com/docs/ai/monitor-usage/${activeKey.provider}`}
        models={MODEL_CATALOG.filter(
          (model) => model.provider === activeKey.provider,
        )}
        projects={projects}
        config={configByKey[activeKey.id]}
        onConfigChange={(next) =>
          setConfigByKey((current) => ({ ...current, [activeKey.id]: next }))
        }
        onBack={closeKey}
      />
    );
  }

  const connectedProviders = [...new Set(keys.map((key) => key.provider))];
  const available = SUPPORTED_AI_PROVIDERS.filter(
    ({ provider }) => !connectedProviders.includes(provider),
  );
  const needsAttention = keys.filter((key) => key.down);

  return (
    <>
      {keys.length === 0 ? (
        <EmptyProviders onConnect={openAddKey} />
      ) : (
        <div className="flex flex-col gap-10">
          <section className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <SectionHeader
                title={t('Connected')}
                count={keys.length}
                description={t(
                  'Each key is a separate connection you can manage on its own.',
                )}
              />
              <Button
                size="sm"
                className="shrink-0"
                onClick={() => openAddKey()}
              >
                <Plus className="size-4" />
                {t('Add key')}
              </Button>
            </div>
            {needsAttention.length > 0 && (
              <AttentionBanner keys={needsAttention} />
            )}
            <ChatProviderRow
              providers={connectedProviders}
              value={chatProvider}
              onChange={setChatProvider}
            />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {keys.map((key) => (
                <KeyCard
                  key={key.id}
                  providerKey={key}
                  config={configByKey[key.id]}
                  onOpen={() => openKey(key.id)}
                />
              ))}
            </div>
          </section>

          {available.length > 0 && (
            <section className="flex flex-col gap-4">
              <SectionHeader
                title={t('Available')}
                count={available.length}
                description={t(
                  'Bring your own API key to connect any of these.',
                )}
              />
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {available.map((providerInfo) => (
                  <AvailableProviderCard
                    key={providerInfo.provider}
                    providerInfo={providerInfo}
                    onConnect={() => openAddKey(providerInfo.provider)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <AddKeyDialog
        open={addKeyOpen}
        onOpenChange={setAddKeyOpen}
        defaultProvider={addKeyProvider}
        onCreate={createKey}
      />
    </>
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
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-5 rounded-2xl bg-gradient-to-b from-primary/[0.06] to-transparent p-6">
        <div className="flex flex-col items-start gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold tracking-tight">
              {t('Add your first AI key')}
            </h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              {t(
                'Turn on chat, agents, and AI steps across your platform. You’ll need an API key from the provider you choose.',
              )}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {recommended.map((info) => (
            <RecommendedProviderCard
              key={info.provider}
              info={info}
              onConnect={() => onConnect(info.provider)}
            />
          ))}
        </div>
      </section>

      {others.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeader
            title={t('Or choose another provider')}
            count={others.length}
            description={t('Bring your own API key to connect any of these.')}
          />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {others.map((providerInfo) => (
              <AvailableProviderCard
                key={providerInfo.provider}
                providerInfo={providerInfo}
                onConnect={() => onConnect(providerInfo.provider)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  count,
  description,
}: {
  title: string;
  count: number;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <span className="text-sm text-muted-foreground tabular-nums">
          {count}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function AttentionBanner({ keys }: { keys: MockProviderKey[] }) {
  const names = keys.map((key) => key.name).join(', ');
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5">
      <TriangleAlert className="size-4 shrink-0 text-destructive" />
      <p className="text-sm">
        {keys.length === 1
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
                  {info?.logoUrl && (
                    <img
                      src={info.logoUrl}
                      alt={provider}
                      className="size-4 object-contain"
                    />
                  )}
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

function KeyCard({
  providerKey,
  config,
  onOpen,
}: {
  providerKey: MockProviderKey;
  config: ProviderConfig;
  onOpen: () => void;
}) {
  const info = providerInfoOf({ provider: providerKey.provider });
  if (!info) {
    return null;
  }

  const scopeLabel =
    config.scope === 'all'
      ? t('All projects')
      : `${config.selectedProjectIds.size} ${
          config.selectedProjectIds.size === 1 ? t('project') : t('projects')
        }`;
  const usageDashboardUrl = PROVIDER_USAGE_DASHBOARDS[providerKey.provider];
  const monitorGuideUrl = `https://www.activepieces.com/docs/ai/monitor-usage/${providerKey.provider}`;

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
      className="flex cursor-pointer flex-col rounded-xl border border-border/60 bg-card text-left transition-colors hover:border-border hover:bg-muted/20"
    >
      <div className="flex items-start gap-3 p-4">
        <ProviderLogoTile info={info} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="truncate text-sm font-medium leading-none">
            {providerKey.name}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  providerKey.down ? 'bg-destructive' : 'bg-success-500',
                )}
              />
              {providerKey.down ? t('Unreachable') : t('Active')}
            </span>
            <span aria-hidden>·</span>
            <span>{info.name}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {config.enabledModelIds.size} {t('models')} · {scopeLabel}
            {providerKey.lastUsedAt && (
              <>
                {' · '}
                {t('used')}{' '}
                {formatUtils.formatDate(new Date(providerKey.lastUsedAt))}
              </>
            )}
          </p>
        </div>
      </div>
      <div className="mt-auto flex items-center gap-4 border-t border-border/60 px-4 py-2.5">
        {usageDashboardUrl && (
          <CardFooterLink
            href={usageDashboardUrl}
            icon={<ExternalLink className="size-3 shrink-0" />}
            label={t('Usage dashboard')}
          />
        )}
        <CardFooterLink
          href={monitorGuideUrl}
          icon={<BookOpen className="size-3 shrink-0" />}
          label={t('Monitoring guide')}
        />
      </div>
    </div>
  );
}

function RecommendedProviderCard({
  info,
  onConnect,
}: {
  info: AiProviderInfo;
  onConnect: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border">
      <ProviderLogoTile info={info} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm font-medium leading-none">{info.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {RECOMMENDED_TAGLINES[info.provider] ?? ''}
        </p>
      </div>
      <Button size="sm" onClick={onConnect}>
        {t('Connect')}
      </Button>
    </div>
  );
}

function AvailableProviderCard({
  providerInfo,
  onConnect,
}: {
  providerInfo: AiProviderInfo;
  onConnect: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border">
      <ProviderLogoTile info={providerInfo} />
      <p className="min-w-0 flex-1 truncate text-sm font-medium">
        {providerInfo.name}
      </p>
      <Button variant="outline" size="sm" onClick={onConnect}>
        {t('Add key')}
      </Button>
    </div>
  );
}

function ProviderLogoTile({ info }: { info: AiProviderInfo }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/60">
      {info.logoUrl && (
        <img
          src={info.logoUrl}
          alt={info.name}
          className="size-5 object-contain"
        />
      )}
    </div>
  );
}

function CardFooterLink({
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
      onClick={(event) => event.stopPropagation()}
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {icon}
      {label}
    </a>
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

function initConfigs({
  keys,
  projects,
}: {
  keys: MockProviderKey[];
  projects: ProjectOption[];
}): Record<string, ProviderConfig> {
  const result: Record<string, ProviderConfig> = {};
  keys.forEach((key) => {
    const models = MODEL_CATALOG.filter(
      (model) => model.provider === key.provider,
    );
    const scopedToSelected = key.provider === AIProviderName.OPENROUTER;
    result[key.id] = {
      enabledModelIds: new Set(models.map((model) => model.id)),
      scope: scopedToSelected ? 'selected' : 'all',
      selectedProjectIds: scopedToSelected
        ? new Set(projects.slice(0, 3).map((project) => project.id))
        : new Set(),
    };
  });
  return result;
}

const PROJECT_COLORS: ColorName[] = [
  ColorName.BLUE,
  ColorName.GREEN,
  ColorName.PURPLE,
  ColorName.ORANGE,
  ColorName.PINK,
  ColorName.CYAN,
  ColorName.RED,
  ColorName.YELLOW,
  ColorName.VIOLET,
  ColorName.DARK_GREEN,
  ColorName.LAVENDER,
  ColorName.DEEP_ORANGE,
];

const RECOMMENDED_PROVIDERS: AIProviderName[] = [
  AIProviderName.ANTHROPIC,
  AIProviderName.OPENAI,
];

const RECOMMENDED_TAGLINES: Partial<Record<AIProviderName, string>> = {
  [AIProviderName.ANTHROPIC]: t('Claude models — strong for chat and agents'),
  [AIProviderName.OPENAI]: t('GPT models — broad ecosystem and tooling'),
};

import { AIProviderName } from '@activepieces/core-utils';
import { t } from 'i18next';
import {
  BookOpen,
  ExternalLink,
  MessageSquare,
  Settings2,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AiProviderInfo, SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import { cn } from '@/lib/utils';

import { MockProviderStatus, MockScenario } from '../mock/fixtures';
import { UpsertAIProviderDialog } from '../universal-pieces/upsert-provider-dialog';

export function ProvidersTab({ scenario }: { scenario: MockScenario }) {
  const [chatProvider, setChatProvider] = useState(scenario.chatProvider);
  const configured = scenario.providers;
  const configuredNames = new Set(configured.map(({ provider }) => provider));
  const available = SUPPORTED_AI_PROVIDERS.filter(
    ({ provider }) => !configuredNames.has(provider),
  );

  return (
    <div className="flex flex-col gap-10">
      {configured.length === 0 && (
        <div className="flex flex-col items-start gap-1 rounded-lg border border-dashed p-6">
          <p className="text-sm font-medium">
            {t('No AI providers connected yet')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t(
              'Connect a provider below to unlock chat, agents, and AI steps for your users.',
            )}
          </p>
        </div>
      )}

      {configured.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeader
            title={t('Connected')}
            count={configured.length}
            description={t(
              'Providers your platform can use today. Each card links to the provider’s own usage dashboard.',
            )}
          />
          <ChatProviderRow
            configured={configured}
            value={chatProvider}
            onChange={setChatProvider}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {configured.map((status) => (
              <ConfiguredProviderCard
                key={status.provider}
                status={status}
                isChatProvider={chatProvider === status.provider}
              />
            ))}
          </div>
        </section>
      )}

      {available.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeader
            title={t('Available')}
            count={available.length}
            description={t('Bring your own API key to connect any of these.')}
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {available.map((providerInfo) => (
              <AvailableProviderCard
                key={providerInfo.provider}
                providerInfo={providerInfo}
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

function ChatProviderRow({
  configured,
  value,
  onChange,
}: {
  configured: MockProviderStatus[];
  value: AIProviderName | null;
  onChange: (provider: AIProviderName) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
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
        onValueChange={(selected) => {
          const status = configured.find(
            ({ provider }) => provider === selected,
          );
          if (status) {
            onChange(status.provider);
          }
        }}
      >
        <SelectTrigger className="w-52">
          <SelectValue placeholder={t('Select provider')} />
        </SelectTrigger>
        <SelectContent>
          {configured.map(({ provider }) => {
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

function ConfiguredProviderCard({
  status,
  isChatProvider,
}: {
  status: MockProviderStatus;
  isChatProvider: boolean;
}) {
  const info = providerInfoOf({ provider: status.provider });
  if (!info) {
    return null;
  }
  return (
    <div className="group flex flex-col rounded-lg border bg-card">
      <div className="flex items-start gap-3 p-4">
        <ProviderLogoTile info={info} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="truncate text-sm font-medium leading-none">
            {info.name}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  status.down ? 'bg-destructive' : 'bg-success-500',
                )}
              />
              {status.down ? t('Unreachable') : t('Operational')}
            </span>
            {isChatProvider && (
              <>
                <span aria-hidden>·</span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="size-3" />
                  {t('Chat')}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          <UpsertAIProviderDialog
            key={status.provider}
            provider={info.provider}
            defaultDisplayName={info.name}
            onSave={() => undefined}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
            >
              <Settings2 className="size-4" />
            </Button>
          </UpsertAIProviderDialog>
          <ConfirmationDeleteDialog
            title={t('Remove AI provider')}
            message={t('Are you sure you want to remove {providerName}?', {
              providerName: info.name,
            })}
            warning={t(
              'All steps using this AI provider will fail after removal.',
            )}
            entityName={info.name}
            mutationFn={async () => undefined}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </ConfirmationDeleteDialog>
        </div>
      </div>
      <div className="mt-auto flex items-center gap-4 border-t px-4 py-2.5">
        {status.usageDashboardUrl && (
          <CardFooterLink
            href={status.usageDashboardUrl}
            icon={<ExternalLink className="size-3 shrink-0" />}
            label={t('Usage dashboard')}
          />
        )}
        {status.monitorGuideUrl && (
          <CardFooterLink
            href={status.monitorGuideUrl}
            icon={<BookOpen className="size-3 shrink-0" />}
            label={t('Monitoring guide')}
          />
        )}
      </div>
    </div>
  );
}

function AvailableProviderCard({
  providerInfo,
}: {
  providerInfo: AiProviderInfo;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
      <ProviderLogoTile info={providerInfo} />
      <p className="min-w-0 flex-1 truncate text-sm font-medium">
        {providerInfo.name}
      </p>
      <UpsertAIProviderDialog
        key={providerInfo.provider}
        provider={providerInfo.provider}
        defaultDisplayName={providerInfo.name}
        onSave={() => undefined}
      >
        <Button variant="outline" size="sm">
          {t('Connect')}
        </Button>
      </UpsertAIProviderDialog>
    </div>
  );
}

function ProviderLogoTile({ info }: { info: AiProviderInfo }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background">
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

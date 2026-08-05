import { AIProviderName } from '@activepieces/core-utils';
import { t } from 'i18next';
import { MessageSquare, Pencil, Trash } from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/custom/item';
import { ItemMediaImage } from '@/components/custom/item-media-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AiProviderInfo, SUPPORTED_AI_PROVIDERS } from '@/features/agents';

import { MockProviderStatus, MockScenario } from '../mock/fixtures';
import { AIProviderCard } from '../universal-pieces/ai-provider-card';
import { UpsertAIProviderDialog } from '../universal-pieces/upsert-provider-dialog';

import { ProviderUsageLinks } from './provider-usage-links';

export function ProvidersTab({ scenario }: { scenario: MockScenario }) {
  const [chatProvider, setChatProvider] = useState(scenario.chatProvider);
  const configured = scenario.providers;
  const configuredNames = new Set(configured.map(({ provider }) => provider));
  const available = SUPPORTED_AI_PROVIDERS.filter(
    ({ provider }) => !configuredNames.has(provider),
  );

  return (
    <div className="flex flex-col gap-8">
      {configured.length === 0 && (
        <div className="flex flex-col items-start gap-1 rounded-lg border border-dashed p-6">
          <p className="text-sm font-medium">
            {t('No AI providers configured yet')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t(
              'Enable a provider below to unlock chat, agents, and AI steps for your users.',
            )}
          </p>
        </div>
      )}

      {configured.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionHeader
            title={t('Configured')}
            description={t(
              'Providers your platform can use today. Usage links open each provider’s own dashboard.',
            )}
          />
          <ChatProviderRow
            configured={configured}
            value={chatProvider}
            onChange={setChatProvider}
          />
          {configured.map((status) => (
            <ConfiguredProviderRow
              key={status.provider}
              status={status}
              isChatProvider={chatProvider === status.provider}
            />
          ))}
        </div>
      )}

      {available.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionHeader
            title={t('Available')}
            description={t(
              'Bring your own key to enable any of these providers.',
            )}
          />
          {available.map((providerInfo) => (
            <AIProviderCard
              key={providerInfo.provider}
              providerInfo={providerInfo}
              onDelete={async () => undefined}
              onSave={() => undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-xs text-muted-foreground">{description}</p>
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
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
        <MessageSquare className="size-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-none">{t('Chat Provider')}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('Select which AI provider powers the chat feature')}
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

function ConfiguredProviderRow({
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
    <Item variant="outline">
      {info.logoUrl && <ItemMediaImage src={info.logoUrl} alt={info.name} />}
      <ItemContent>
        <ItemTitle>
          <span className="flex items-center gap-2">
            {info.name}
            {status.down ? (
              <Badge variant="destructive">{t('Unreachable')}</Badge>
            ) : (
              <Badge variant="success">{t('Active')}</Badge>
            )}
            {isChatProvider && <Badge variant="outline">{t('Chat')}</Badge>}
          </span>
        </ItemTitle>
        <ItemDescription>
          <ProviderUsageLinks status={status} />
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <UpsertAIProviderDialog
          key={status.provider}
          provider={info.provider}
          defaultDisplayName={info.name}
          onSave={() => undefined}
        >
          <Button variant="ghost" size="sm">
            <Pencil className="size-4" />
          </Button>
        </UpsertAIProviderDialog>
        <ConfirmationDeleteDialog
          title={t('Delete AI Provider')}
          message={t('Are you sure you want to delete {providerName}?', {
            providerName: info.name,
          })}
          warning={t(
            'All steps using this AI provider will fail after deletion.',
          )}
          entityName={info.name}
          mutationFn={async () => undefined}
        >
          <Button variant="ghost" size="sm">
            <Trash className="size-4 text-destructive" />
          </Button>
        </ConfirmationDeleteDialog>
      </ItemActions>
    </Item>
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

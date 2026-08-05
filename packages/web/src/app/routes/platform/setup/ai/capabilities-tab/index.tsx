import { AiToolCapability, AiToolProvider } from '@activepieces/shared';
import { t } from 'i18next';
import {
  Globe,
  Image,
  LucideIcon,
  Search,
  Settings2,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { AiCapabilityDialog } from '../../ai-capabilities/ai-capability-dialog';
import {
  AI_TOOL_CATALOG,
  AiToolCapabilityInfo,
  AiToolProviderInfo,
} from '../../ai-capabilities/catalog';
import { MockScenario } from '../mock/fixtures';

export function CapabilitiesTab({ scenario }: { scenario: MockScenario }) {
  const [configs, setConfigs] = useState<CapabilityConfigs>(
    scenario.providers.length === 0 ? {} : SEEDED_CONFIGS,
  );

  const updateConfig = ({
    capability,
    config,
  }: {
    capability: AiToolCapability;
    config: MockCapabilityConfig | undefined;
  }) => {
    setConfigs((current) => ({ ...current, [capability]: config }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <h2 className="text-base font-semibold tracking-tight">
            {t('Assistant capabilities')}
          </h2>
          <span className="text-sm text-muted-foreground tabular-nums">
            {AI_TOOL_CATALOG.length}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {t(
            'Connect external services so the AI assistant can search the web, scrape pages, and generate images.',
          )}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {AI_TOOL_CATALOG.map((capabilityInfo) => (
          <CapabilityCard
            key={capabilityInfo.capability}
            capabilityInfo={capabilityInfo}
            config={configs[capabilityInfo.capability]}
            onToggle={(enabled) =>
              updateConfig({
                capability: capabilityInfo.capability,
                config: withEnabled({
                  config: configs[capabilityInfo.capability],
                  enabled,
                }),
              })
            }
            onDelete={() =>
              updateConfig({
                capability: capabilityInfo.capability,
                config: undefined,
              })
            }
            onSetUp={() =>
              updateConfig({
                capability: capabilityInfo.capability,
                config: {
                  enabled: true,
                  provider: capabilityInfo.providers[0].id,
                },
              })
            }
          />
        ))}
      </div>
    </div>
  );
}

function CapabilityCard({
  capabilityInfo,
  config,
  onToggle,
  onDelete,
  onSetUp,
}: {
  capabilityInfo: AiToolCapabilityInfo;
  config: MockCapabilityConfig | undefined;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
  onSetUp: () => void;
}) {
  const Icon = CAPABILITY_ICON[capabilityInfo.capability];
  const connectedProvider = capabilityInfo.providers.find(
    (provider) => provider.id === config?.provider,
  );

  return (
    <div className="group flex flex-col rounded-lg border bg-card">
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="truncate text-sm font-medium leading-none">
            {capabilityInfo.name}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span
                className={cn('size-1.5 rounded-full', {
                  'bg-success-500': config?.enabled,
                  'bg-muted-foreground/40': config && !config.enabled,
                  'border border-muted-foreground/50': !config,
                })}
              />
              {!config
                ? t('Not connected')
                : config.enabled
                ? t('Active')
                : t('Turned off')}
            </span>
            {connectedProvider && (
              <>
                <span aria-hidden>·</span>
                <ProviderLink provider={connectedProvider} />
              </>
            )}
          </div>
        </div>
        {config && (
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            <AiCapabilityDialog
              capabilityInfo={capabilityInfo}
              onSaved={onSetUp}
            >
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
              >
                <Settings2 className="size-4" />
              </Button>
            </AiCapabilityDialog>
            <ConfirmationDeleteDialog
              title={t('Disconnect {name}', { name: capabilityInfo.name })}
              message={t(
                'This removes the saved API key and disables this capability.',
              )}
              entityName={capabilityInfo.name}
              mutationFn={async () => onDelete()}
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
        )}
      </div>
      <p className="px-4 pb-4 text-sm text-muted-foreground">
        {capabilityInfo.description}
      </p>
      <div className="mt-auto flex items-center justify-between gap-4 border-t px-4 py-2.5">
        {config ? (
          <>
            <span className="text-xs text-muted-foreground">
              {config.enabled
                ? t('Available to the assistant')
                : t('Hidden from the assistant')}
            </span>
            <Switch checked={config.enabled} onCheckedChange={onToggle} />
          </>
        ) : (
          <>
            <span className="flex min-w-0 items-center gap-1.5 truncate text-xs text-muted-foreground">
              {capabilityInfo.providers.map((provider, index) => (
                <span key={provider.id} className="flex items-center gap-1.5">
                  {index > 0 && <span aria-hidden>·</span>}
                  <ProviderLink provider={provider} />
                </span>
              ))}
            </span>
            <AiCapabilityDialog
              capabilityInfo={capabilityInfo}
              onSaved={onSetUp}
            >
              <Button variant="outline" size="sm">
                {t('Connect')}
              </Button>
            </AiCapabilityDialog>
          </>
        )}
      </div>
    </div>
  );
}

function ProviderLink({ provider }: { provider: AiToolProviderInfo }) {
  return (
    <a
      href={provider.signupUrl}
      target="_blank"
      rel="noreferrer"
      className="underline-offset-2 transition-colors hover:text-foreground hover:underline"
    >
      {provider.name}
    </a>
  );
}

function withEnabled({
  config,
  enabled,
}: {
  config: MockCapabilityConfig | undefined;
  enabled: boolean;
}): MockCapabilityConfig | undefined {
  return config === undefined ? undefined : { ...config, enabled };
}

const CAPABILITY_ICON: Record<AiToolCapability, LucideIcon> = {
  [AiToolCapability.WEB_SEARCH]: Search,
  [AiToolCapability.WEB_SCRAPING]: Globe,
  [AiToolCapability.IMAGE_GENERATION]: Image,
};

const SEEDED_CONFIGS: CapabilityConfigs = {
  [AiToolCapability.WEB_SEARCH]: {
    enabled: true,
    provider: AiToolProvider.TAVILY,
  },
  [AiToolCapability.IMAGE_GENERATION]: {
    enabled: false,
    provider: AiToolProvider.FAL,
  },
};

type MockCapabilityConfig = {
  enabled: boolean;
  provider: AiToolProvider;
};

type CapabilityConfigs = Partial<
  Record<AiToolCapability, MockCapabilityConfig>
>;

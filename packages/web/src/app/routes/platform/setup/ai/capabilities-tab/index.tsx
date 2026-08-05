import { AiToolCapability, AiToolProvider } from '@activepieces/shared';
import { t } from 'i18next';
import { Globe, Image, LucideIcon, Pencil, Search, Trash } from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/custom/item';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

import { AiCapabilityDialog } from '../../ai-capabilities/ai-capability-dialog';
import {
  AI_TOOL_CATALOG,
  AiToolCapabilityInfo,
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
      <p className="text-sm text-muted-foreground">
        {t(
          'Connect external services so the AI assistant can search the web, scrape pages, and generate images.',
        )}
      </p>
      <div className="flex flex-col gap-3">
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
  const providerName = capabilityInfo.providers.find(
    (provider) => provider.id === config?.provider,
  )?.name;

  return (
    <Item variant="outline">
      <ItemMedia variant="icon">
        <Icon className="size-4 text-muted-foreground" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          <span className="flex items-center gap-2">
            {capabilityInfo.name}
            {providerName && <Badge variant="outline">{providerName}</Badge>}
          </span>
        </ItemTitle>
        <ItemDescription>{capabilityInfo.description}</ItemDescription>
      </ItemContent>
      <ItemActions>
        {config && (
          <Switch checked={config.enabled} onCheckedChange={onToggle} />
        )}
        <AiCapabilityDialog capabilityInfo={capabilityInfo} onSaved={onSetUp}>
          {config ? (
            <Button variant="ghost" size="icon">
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button variant="basic">{t('Set up')}</Button>
          )}
        </AiCapabilityDialog>
        {config && (
          <ConfirmationDeleteDialog
            title={t('Disconnect {name}', { name: capabilityInfo.name })}
            message={t(
              'This removes the saved API key and disables this capability.',
            )}
            entityName={capabilityInfo.name}
            mutationFn={async () => onDelete()}
          >
            <Button variant="ghost" size="icon">
              <Trash className="size-4" />
            </Button>
          </ConfirmationDeleteDialog>
        )}
      </ItemActions>
    </Item>
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

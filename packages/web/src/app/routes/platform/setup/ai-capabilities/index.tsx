import {
  AiToolCapability,
  AiToolConfigWithoutSensitiveData,
  PlatformRole,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Globe,
  Image,
  LucideIcon,
  Pencil,
  Search,
  Trash,
  UserSearch,
} from 'lucide-react';

import { CenteredPage } from '@/app/components/centered-page';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  aiToolConfigMutations,
  aiToolConfigQueries,
} from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';

import LockedFeatureGuard from '../../../../components/locked-feature-guard';

import { AiCapabilityDialog } from './ai-capability-dialog';
import { AI_TOOL_CATALOG, AiToolCapabilityInfo } from './catalog';

const CAPABILITY_ICON: Record<AiToolCapability, LucideIcon> = {
  [AiToolCapability.WEB_SEARCH]: Search,
  [AiToolCapability.WEB_SCRAPING]: Globe,
  [AiToolCapability.IMAGE_GENERATION]: Image,
  [AiToolCapability.ENRICHMENT]: UserSearch,
};

export default function AiCapabilitiesPage() {
  const { data: configs, refetch } = aiToolConfigQueries.useAiToolConfigs();
  const { data: currentUser } = userHooks.useCurrentUser();
  const { platform } = platformHooks.useCurrentPlatform();
  const allowWrite = platform.plan.aiProvidersEnabled;

  const { mutate: toggle } = aiToolConfigMutations.useUpdateAiToolConfig({
    onSuccess: () => refetch(),
  });
  const { mutate: remove } = aiToolConfigMutations.useDeleteAiToolConfig({
    onSuccess: () => refetch(),
  });

  return (
    <LockedFeatureGuard
      featureKey="UNIVERSAL_AI"
      locked={currentUser?.platformRole !== PlatformRole.ADMIN}
      lockTitle={t('Unlock AI Capabilities')}
      lockDescription={t(
        'Give the AI assistant web search, scraping, and image generation by connecting the services you choose.',
      )}
    >
      <CenteredPage
        title={t('AI Capabilities')}
        description={t(
          'Connect external services so the AI assistant can search the web, scrape pages, and generate images.',
        )}
      >
        <div className="flex flex-col gap-4">
          {AI_TOOL_CATALOG.map((capabilityInfo) => {
            const config = configs?.find(
              (c) => c.capability === capabilityInfo.capability,
            );
            return (
              <CapabilityCard
                key={capabilityInfo.capability}
                capabilityInfo={capabilityInfo}
                Icon={CAPABILITY_ICON[capabilityInfo.capability]}
                config={config}
                allowWrite={allowWrite}
                onToggle={(checked) =>
                  config &&
                  toggle({ id: config.id, request: { enabled: checked } })
                }
                onDelete={() => config && remove(config.id)}
                onSaved={() => refetch()}
              />
            );
          })}
        </div>
      </CenteredPage>
    </LockedFeatureGuard>
  );
}

function CapabilityCard({
  capabilityInfo,
  Icon,
  config,
  allowWrite,
  onToggle,
  onDelete,
  onSaved,
}: {
  capabilityInfo: AiToolCapabilityInfo;
  Icon: LucideIcon;
  config?: AiToolConfigWithoutSensitiveData;
  allowWrite: boolean;
  onToggle: (checked: boolean) => void;
  onDelete: () => void;
  onSaved: () => void;
}) {
  const configId = config?.id;
  const enabled = config?.enabled ?? false;
  const providerName = capabilityInfo.providers.find(
    (p) => p.id === config?.provider,
  )?.name;
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-none">
          {capabilityInfo.name}
          {providerName && (
            <span className="text-muted-foreground font-normal">
              {' · '}
              {providerName}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {capabilityInfo.description}
        </p>
      </div>

      {allowWrite && (
        <div className="flex items-center gap-2 shrink-0">
          {configId && <Switch checked={enabled} onCheckedChange={onToggle} />}
          <AiCapabilityDialog
            capabilityInfo={capabilityInfo}
            existingConfig={config}
            onSaved={onSaved}
          >
            {configId ? (
              <Button variant="ghost" size="icon">
                <Pencil className="size-4" />
              </Button>
            ) : (
              <Button variant="basic">{t('Set up')}</Button>
            )}
          </AiCapabilityDialog>
          {configId && (
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
        </div>
      )}
    </div>
  );
}

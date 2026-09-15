import { AIProviderName } from '@activepieces/core-utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import { SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import { billingQueries } from '@/features/billing';
import {
  aiProviderQueries,
  aiToolConfigQueries,
} from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { AI_TOOL_CATALOG } from '../setup/ai-capabilities/catalog';

import {
  AdminOverview,
  OverviewCard,
  OverviewCards,
  OverviewRow,
  OverviewRows,
  OverviewSection,
} from './overview-shell';

export function AiOverview() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCommunity = edition === ApEdition.COMMUNITY;
  const { data: providers, isLoading: isLoadingProviders } =
    aiProviderQueries.useAiProviderConfigs();
  const { data: toolConfigs, isLoading: isLoadingTools } =
    aiToolConfigQueries.useAiToolConfigs();
  const { data: subscription } = billingQueries.usePlatformSubscription(
    platform.id,
    !isCommunity,
  );

  const configured = (providers ?? []).filter(
    (provider) => provider.provider !== AIProviderName.ACTIVEPIECES,
  );
  const chatProvider = (providers ?? []).find(
    (provider) => provider.enabledForChat,
  );
  const connectedTools = (toolConfigs ?? []).filter((config) => config.enabled);
  const chatProviderName =
    SUPPORTED_AI_PROVIDERS.find(
      (info) => info.provider === chatProvider?.provider,
    )?.name ?? chatProvider?.provider;

  const credits = subscription?.usage.creditsUsed ?? 0;
  const creditsIncluded = subscription?.plan.includedCredits ?? 0;
  const creditsPercent =
    creditsIncluded === 0
      ? 0
      : Math.min(100, Math.round((credits / creditsIncluded) * 100));

  return (
    <AdminOverview
      title={t('AI Center & MCP')}
      description={t(
        'Models, assistant capabilities and the MCP server your flows and chat rely on.',
      )}
    >
      <OverviewCards>
        <OverviewCard
          to="/platform/setup/ai?tab=providers"
          title={t('Providers')}
          value={configured.length}
          isLoading={isLoadingProviders}
          description={
            chatProvider === undefined
              ? t('No provider powers chat yet')
              : t('{provider} powers chat', { provider: chatProviderName })
          }
        />
        {!isCommunity && (
          <OverviewCard
            to="/platform/setup/ai?tab=capabilities"
            title={t('Capabilities')}
            value={t('{connected} of {total}', {
              connected: connectedTools.length,
              total: AI_TOOL_CATALOG.length,
            })}
            isLoading={isLoadingTools}
            description={t(
              'Web search, scraping and image generation for the assistant',
            )}
          />
        )}
        <OverviewCard
          to="/platform/setup/ai?tab=mcp"
          title={t('MCP Server')}
          value={t('Ready')}
          description={t('Expose platform tools to external MCP clients')}
        />
      </OverviewCards>

      {!isCommunity && (
        <OverviewSection
          title={t('AI credits this month')}
          description={t(
            'Credits spent on AI steps and chat, out of your plan total.',
          )}
        >
          <div className="flex flex-col gap-2 rounded-lg border p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm">
                <span className="text-lg font-semibold">
                  {credits.toLocaleString()}
                </span>{' '}
                {t('used')}
              </span>
              <span className="text-sm text-muted-foreground">
                {t('{included} included', {
                  included: creditsIncluded.toLocaleString(),
                })}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${creditsPercent}%` }}
              />
            </div>
          </div>
        </OverviewSection>
      )}

      <OverviewSection
        title={t('Default model')}
        description={t(
          'Used by AI steps and the assistant when a flow does not pick a model explicitly.',
        )}
      >
        <OverviewRows>
          <OverviewRow
            tone={chatProvider === undefined ? 'off' : 'ok'}
            label={
              chatProvider === undefined
                ? t('No provider enabled for chat')
                : chatProviderName
            }
          >
            <Button variant="outline" size="sm" asChild>
              <a href="/platform/setup/ai?tab=providers">{t('Change')}</a>
            </Button>
          </OverviewRow>
        </OverviewRows>
      </OverviewSection>
    </AdminOverview>
  );
}

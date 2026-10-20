import { AIProviderName, isNil } from '@activepieces/core-utils';
import {
  AI_PROVIDER_CAPABILITIES,
  AIProviderWithoutSensitiveData,
  AiToolCapability,
  ModelChoice,
  ModelOptions,
  PlatformModelTier,
} from '@activepieces/shared';
import { t } from 'i18next';
import { MessageSquare, TriangleAlert } from 'lucide-react';
import { useMemo } from 'react';

import { SettingsPanel, SettingsRow } from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ModelPicker, modelPickerUtils } from '@/features/agents';
import { aiModelHooks } from '@/features/agents/ai-model/hooks';
import { modelMeta } from '@/features/agents/ai-model/model-meta';
import { aiToolConfigQueries } from '@/features/platform-admin';
import { platformModelTierMutations } from '@/features/platform-admin/hooks/platform-model-tier-hooks';
import { platformConfigurationHooks } from '@/hooks/platform-configuration-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

export function DefaultChatModelCard({
  configs,
  tiers,
  projectIds,
}: {
  configs: AIProviderWithoutSensitiveData[];
  tiers: PlatformModelTier[];
  projectIds: string[];
}) {
  const { data: configuration } =
    platformConfigurationHooks.useCurrentPlatformConfiguration();
  const { data: options } = aiModelHooks.useModelOptions({ surface: 'chat' });
  const { data: toolConfigs } = aiToolConfigQueries.useAiToolConfigs();
  const { mutate: save, isPending } =
    platformModelTierMutations.useSetDefaultChatModel();
  const value = configuration?.defaultChatModel ?? null;
  const configsById = useMemo(
    () => new Map(configs.map((config) => [config.id, config])),
    [configs],
  );
  const hasEmbeddingsKey = (toolConfigs ?? []).some(
    (toolConfig) =>
      toolConfig.capability === AiToolCapability.EMBEDDINGS &&
      toolConfig.enabled,
  );
  const status = isNil(options)
    ? null
    : statusOf({
        value,
        options,
        tiers,
        configsById,
        projectIds,
        hasEmbeddingsKey,
      });

  return (
    <SettingsPanel flush>
      <SettingsRow
        icon={<MessageSquare />}
        title={t('Default chat model')}
        description={t('New chats start on this model.')}
      >
        <div className="flex items-center gap-2">
          <div className="flex min-w-7 shrink-0 items-center justify-end">
            {!isNil(status) && status.unavailable && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-warning-11"
                    onClick={() => save(null)}
                  >
                    {t('Use default')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{status.warnings.join(' ')}</TooltipContent>
              </Tooltip>
            )}
            {!isNil(status) &&
              !status.unavailable &&
              status.warnings.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TriangleAlert
                      className="size-4 text-warning-11"
                      aria-label={status.warnings.join(' ')}
                    />
                  </TooltipTrigger>
                  <TooltipContent>{status.warnings.join(' ')}</TooltipContent>
                </Tooltip>
              )}
          </div>
          <div
            className="w-64"
            {...adminControl(AdminControl.AI_DEFAULT_CHAT_MODEL_SELECT)}
          >
            {isNil(configuration) ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <ModelPicker
                surface="chat"
                value={value}
                disabled={isPending}
                placeholder={status?.placeholder}
                onChange={(choice) =>
                  save(sameChoice({ a: choice, b: value }) ? null : choice)
                }
              />
            )}
          </div>
        </div>
      </SettingsRow>
    </SettingsPanel>
  );
}

function statusOf({
  value,
  options,
  tiers,
  configsById,
  projectIds,
  hasEmbeddingsKey,
}: {
  value: ModelChoice | null;
  options: ModelOptions;
  tiers: PlatformModelTier[];
  configsById: Map<string, AIProviderWithoutSensitiveData>;
  projectIds: string[];
  hasEmbeddingsKey: boolean;
}): CardStatus {
  const fallback = isNil(options.defaultChoice)
    ? null
    : labelOf({ choice: options.defaultChoice, options });
  if (isNil(value)) {
    return {
      placeholder: isNil(fallback)
        ? t('Not set')
        : t('Not set · uses {model}', { model: fallback }),
      warnings: [],
      unavailable: false,
    };
  }
  if (modelPickerUtils.isUnavailable({ options, value })) {
    return {
      placeholder: undefined,
      warnings: [
        isNil(fallback)
          ? t('This model is no longer available.')
          : t('This model is no longer available. New chats use {model}.', {
              model: fallback,
            }),
      ],
      unavailable: true,
    };
  }
  const missing = projectsWithout({ value, tiers, configsById, projectIds });
  const warnings = [
    ...(missing > 0
      ? [
          t(
            'Not available in {count, plural, =1 {1 project} other {# projects}}.',
            { count: missing },
          ),
        ]
      : []),
    ...(!hasEmbeddingsKey &&
    isNil(options.credits) &&
    !canEmbed({ provider: keyProviderOf({ value, tiers, configsById }) })
      ? [
          t(
            "This key can't index knowledge-base files. Set an Embeddings key in Capabilities.",
          ),
        ]
      : []),
  ];
  return { placeholder: undefined, warnings, unavailable: false };
}

function keyProviderOf({
  value,
  tiers,
  configsById,
}: {
  value: ModelChoice;
  tiers: PlatformModelTier[];
  configsById: Map<string, AIProviderWithoutSensitiveData>;
}): AIProviderName | undefined {
  if (value.type === 'model') {
    return value.provider;
  }
  const mainConfigId = tiers.find((tier) => tier.id === value.tierId)
    ?.entries[0]?.configId;
  return isNil(mainConfigId)
    ? undefined
    : configsById.get(mainConfigId)?.provider;
}

function canEmbed({
  provider,
}: {
  provider: AIProviderName | undefined;
}): boolean {
  return (
    isNil(provider) || AI_PROVIDER_CAPABILITIES[provider].supportsEmbedding
  );
}

function sameChoice({
  a,
  b,
}: {
  a: ModelChoice;
  b: ModelChoice | null;
}): boolean {
  if (isNil(b) || a.type !== b.type) {
    return false;
  }
  if (a.type === 'tier' && b.type === 'tier') {
    return a.tierId === b.tierId;
  }
  return (
    a.type === 'model' &&
    b.type === 'model' &&
    a.modelId === b.modelId &&
    (a.providerConfigId === b.providerConfigId ||
      (a.provider === AIProviderName.ACTIVEPIECES &&
        b.provider === AIProviderName.ACTIVEPIECES))
  );
}

function projectsWithout({
  value,
  tiers,
  configsById,
  projectIds,
}: {
  value: ModelChoice;
  tiers: PlatformModelTier[];
  configsById: Map<string, AIProviderWithoutSensitiveData>;
  projectIds: string[];
}): number {
  if (value.type === 'tier') {
    const tier = tiers.find((candidate) => candidate.id === value.tierId);
    return isNil(tier)
      ? 0
      : modelMeta.tierReach({ tier, configsById, projectIds }).unavailableCount;
  }
  const config = configsById.get(value.providerConfigId);
  if (isNil(config)) {
    return 0;
  }
  const entry = { configId: value.providerConfigId, modelId: value.modelId };
  return projectIds.filter(
    (projectId) => !modelMeta.entryRunsIn({ entry, config, projectId }),
  ).length;
}

function labelOf({
  choice,
  options,
}: {
  choice: ModelChoice;
  options: ModelOptions;
}): string | null {
  if (choice.type === 'tier') {
    return (
      options.tiers.find((tier) => tier.id === choice.tierId)?.name ?? null
    );
  }
  if (choice.provider === AIProviderName.ACTIVEPIECES) {
    return (
      options.credits?.tiers.find((tier) => tier.id === choice.modelId)
        ?.label ?? null
    );
  }
  return (
    options.keys
      .find((key) => key.providerConfigId === choice.providerConfigId)
      ?.models.find((model) => model.id === choice.modelId)?.name ?? null
  );
}

type CardStatus = {
  placeholder: string | undefined;
  warnings: string[];
  unavailable: boolean;
};

export const defaultChatModelCardUtils = { statusOf, sameChoice };

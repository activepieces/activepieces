import { isNil } from '@activepieces/core-utils';
import {
  AIProviderWithoutSensitiveData,
  ModelChoice,
  ModelOptions,
  PlatformModelTier,
} from '@activepieces/shared';
import { t } from 'i18next';
import { MessageSquare } from 'lucide-react';
import { useMemo } from 'react';

import { SettingsPanel, SettingsRow } from '@/app/components/admin';
import { ModelPicker, modelPickerUtils } from '@/features/agents';
import { aiModelHooks } from '@/features/agents/ai-model/hooks';
import { modelMeta } from '@/features/agents/ai-model/model-meta';
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
  const { mutate: save, isPending } =
    platformModelTierMutations.useSetDefaultChatModel();
  const value = configuration?.defaultChatModel ?? null;
  const configsById = useMemo(
    () => new Map(configs.map((config) => [config.id, config])),
    [configs],
  );
  const note = isNil(options)
    ? null
    : noteOf({ value, options, tiers, configsById, projectIds });

  return (
    <SettingsPanel flush>
      <SettingsRow
        icon={<MessageSquare />}
        title={t('Default chat model')}
        description={
          <>
            {t(
              'New chats start on this model. People can switch in each chat. Memory and knowledge-base embeddings use its key.',
            )}
            {!isNil(note) && (
              <span className="mt-1 block text-xs text-warning-11">{note}</span>
            )}
          </>
        }
      >
        <div
          className="w-64"
          {...adminControl(AdminControl.AI_DEFAULT_CHAT_MODEL_SELECT)}
        >
          <ModelPicker
            surface="chat"
            value={value}
            disabled={isPending}
            onChange={(choice) => save(choice)}
          />
        </div>
      </SettingsRow>
    </SettingsPanel>
  );
}

function noteOf({
  value,
  options,
  tiers,
  configsById,
  projectIds,
}: {
  value: ModelChoice | null;
  options: ModelOptions;
  tiers: PlatformModelTier[];
  configsById: Map<string, AIProviderWithoutSensitiveData>;
  projectIds: string[];
}): string | null {
  if (isNil(value)) {
    const fallback = isNil(options.defaultChoice)
      ? null
      : labelOf({ choice: options.defaultChoice, options });
    return isNil(fallback)
      ? t('Not set.')
      : t('Not set. New chats use {model}.', { model: fallback });
  }
  if (modelPickerUtils.isUnavailable({ options, value })) {
    return t('Unavailable. New chats fall back to the next available model.');
  }
  const missing = projectsWithout({ value, tiers, configsById, projectIds });
  return missing > 0
    ? t(
        'Not available in {count, plural, =1 {1 project} other {# projects}}. New chats there use the next available model.',
        { count: missing },
      )
    : null;
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
  const creditTier = options.credits?.tiers.find(
    (tier) => tier.id === choice.modelId,
  );
  if (choice.providerConfigId === options.credits?.providerConfigId) {
    return creditTier?.label ?? null;
  }
  return (
    options.keys
      .find((key) => key.providerConfigId === choice.providerConfigId)
      ?.models.find((model) => model.id === choice.modelId)?.name ?? null
  );
}

export const defaultChatModelCardUtils = { noteOf };

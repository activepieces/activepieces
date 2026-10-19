import { AIProviderName, isNil } from '@activepieces/core-utils';
import {
  AIProviderWithoutSensitiveData,
  ModelChoice,
  ModelOptions,
  PlatformModelTier,
} from '@activepieces/shared';
import { t } from 'i18next';
import { MessageSquare, TriangleAlert, X } from 'lucide-react';
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
        description={t('New chats start on this model.')}
      >
        <div className="flex items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center">
            {!isNil(note) && note.warn && (
              <Tooltip>
                <TooltipTrigger asChild>
                  {note.unavailable ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('Clear')}
                      onClick={() => save(null)}
                    >
                      <X className="size-4 text-warning-11" />
                    </Button>
                  ) : (
                    <TriangleAlert className="size-4 text-warning-11" />
                  )}
                </TooltipTrigger>
                <TooltipContent>{note.text}</TooltipContent>
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
                placeholder={!isNil(note) && !note.warn ? note.text : undefined}
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
}): CardNote | null {
  if (isNil(value)) {
    const fallback = isNil(options.defaultChoice)
      ? null
      : labelOf({ choice: options.defaultChoice, options });
    return {
      text: isNil(fallback)
        ? t('Not set')
        : t('Not set · uses {model}', { model: fallback }),
      warn: false,
      unavailable: false,
    };
  }
  if (modelPickerUtils.isUnavailable({ options, value })) {
    return {
      text: t('Unavailable. New chats use a fallback. Click to clear.'),
      warn: true,
      unavailable: true,
    };
  }
  const missing = projectsWithout({ value, tiers, configsById, projectIds });
  return missing > 0
    ? {
        text: t(
          'Not available in {count, plural, =1 {1 project} other {# projects}}',
          { count: missing },
        ),
        warn: true,
        unavailable: false,
      }
    : null;
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

type CardNote = { text: string; warn: boolean; unavailable: boolean };

export const defaultChatModelCardUtils = { noteOf, sameChoice };

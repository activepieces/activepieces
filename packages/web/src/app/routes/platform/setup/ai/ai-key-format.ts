import { AIProviderName } from '@activepieces/core-utils';
import { AIProviderWithoutSensitiveData, Project } from '@activepieces/shared';
import { t } from 'i18next';

import { AiProviderInfo, SUPPORTED_AI_PROVIDERS } from '@/features/agents';

function modelsSummary({
  config,
}: {
  config: AIProviderWithoutSensitiveData;
}): string {
  return config.modelScope === 'all'
    ? t('All models')
    : t('modelsCount', { count: config.modelIds.length });
}

function projectsSummary({
  config,
  projects,
}: {
  config: AIProviderWithoutSensitiveData;
  projects: Project[];
}): string {
  const named = projects.filter((project) =>
    config.projectIds.includes(project.id),
  ).length;
  switch (config.projectScope) {
    case 'all':
      return t('All projects');
    case 'except':
      return t('All projects except {count}', { count: named });
    default:
      return t('{count, plural, =1 {1 project} other {# projects}}', {
        count: named,
      });
  }
}

function providerInfo({
  provider,
}: {
  provider: AIProviderName;
}): AiProviderInfo | undefined {
  return SUPPORTED_AI_PROVIDERS.find(
    (candidate) => candidate.provider === provider,
  );
}

export const aiKeyFormat = {
  modelsSummary,
  projectsSummary,
  providerInfo,
};

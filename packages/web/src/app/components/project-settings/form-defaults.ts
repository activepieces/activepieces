import type { ProjectWithLimits } from '@activepieces/shared';

import type { FormValues } from './general';

export function projectSettingsFormDefaults(
  project: ProjectWithLimits,
): FormValues {
  return {
    projectName: project.displayName,
    icon: project.icon,
    externalId: project.externalId ?? '',
    maxConcurrentJobs: project.maxConcurrentJobs,
    activeFlowsLimit: project.plan?.activeFlowsLimit ?? null,
    sensitive: project.sensitive ?? false,
  };
}

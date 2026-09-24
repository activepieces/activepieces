import { ColorName, PiecesFilterType, ProjectType } from '@activepieces/shared';
import type { ProjectWithLimits } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { projectSettingsFormDefaults } from '@/app/components/project-settings/form-defaults';

function makeProject(
  overrides: Partial<ProjectWithLimits> = {},
): ProjectWithLimits {
  return {
    id: 'proj1',
    created: '2024-01-01T00:00:00.000Z',
    updated: '2024-01-01T00:00:00.000Z',
    type: ProjectType.TEAM,
    ownerId: 'user1',
    displayName: 'Acme',
    platformId: 'platform1',
    maxConcurrentJobs: null,
    icon: { color: ColorName.BLUE },
    externalId: null,
    releasesEnabled: false,
    notifyFlowOwnerOnFailure: false,
    metadata: null,
    sensitive: false,
    plan: {
      id: 'plan1',
      created: '2024-01-01T00:00:00.000Z',
      updated: '2024-01-01T00:00:00.000Z',
      projectId: 'proj1',
      locked: false,
      name: 'default',
      piecesFilterType: PiecesFilterType.NONE,
      pieces: [],
    },
    analytics: {
      totalUsers: 0,
      activeUsers: 0,
      totalFlows: 0,
      activeFlows: 0,
      lastFlowUpdated: null,
    },
    ...overrides,
  };
}

const baseProject = makeProject();

describe('projectSettingsFormDefaults', () => {
  it('seeds externalId from the project', () => {
    const defaults = projectSettingsFormDefaults(
      makeProject({ externalId: 'org-3412321' }),
    );

    expect(defaults.externalId).toBe('org-3412321');
  });

  it('seeds an empty string when the project has no externalId', () => {
    const defaults = projectSettingsFormDefaults(
      makeProject({ externalId: null }),
    );

    expect(defaults.externalId).toBe('');
  });

  it('seeds every editable field from the project', () => {
    const defaults = projectSettingsFormDefaults(
      makeProject({
        displayName: 'Acme Prod',
        externalId: 'org-9',
        maxConcurrentJobs: 12,
        sensitive: true,
        plan: { ...baseProject.plan, activeFlowsLimit: 40 },
      }),
    );

    expect(defaults).toEqual({
      projectName: 'Acme Prod',
      icon: { color: ColorName.BLUE },
      externalId: 'org-9',
      maxConcurrentJobs: 12,
      activeFlowsLimit: 40,
      sensitive: true,
    });
  });
});

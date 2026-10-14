/**
 * @vitest-environment jsdom
 */
import { ColorName, ProjectType } from '@activepieces/shared';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/features/projects', () => ({
  projectCollectionUtils: {
    useCurrentProject: () => ({
      project: {
        id: 'project-1',
        displayName: 'Team project',
        type: ProjectType.TEAM,
        icon: { color: ColorName.BLUE },
        externalId: null,
        maxConcurrentJobs: null,
        sensitive: false,
        plan: { activeFlowsLimit: null },
      },
    }),
  },
}));

vi.mock('@/features/projects/components/ap-project-display', () => ({
  ApProjectDisplay: () => null,
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({ checkAccess: () => true }),
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: true }) },
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { plan: { embeddingEnabled: false } },
    }),
  },
}));

vi.mock('@/hooks/user-hooks', () => ({
  userHooks: { getCurrentUserPlatformRole: () => 'ADMIN' },
}));

vi.mock('@/lib/api', () => ({ api: {} }));

vi.mock('@/app/components/project-settings/alerts', () => ({
  AlertsSettings: () => null,
}));
vi.mock('@/app/components/project-settings/environment', () => ({
  EnvironmentSettings: () => null,
}));
vi.mock('@/app/components/project-settings/general', () => ({
  GeneralSettings: () => null,
}));
vi.mock('@/app/components/project-settings/members', () => ({
  MembersSettings: () => <div>{'members list'}</div>,
}));
vi.mock('@/app/components/project-settings/pieces', () => ({
  PiecesSettings: () => null,
}));

import { ProjectSettingsDialog } from '@/app/components/project-settings';

describe('ProjectSettingsDialog', () => {
  it('has an accessible name when opened on the members tab', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const consoleWarn = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);

    render(
      <ProjectSettingsDialog
        open={true}
        onClose={() => undefined}
        initialTab="members"
      />,
    );

    const radixDialogWarnings = [
      ...consoleError.mock.calls,
      ...consoleWarn.mock.calls,
    ].filter((call) => String(call[0]).includes('DialogContent'));
    expect(radixDialogWarnings).toEqual([]);
    within(screen.getByRole('dialog', { name: 'Project settings' })).getByText(
      'members list',
    );
  });
});

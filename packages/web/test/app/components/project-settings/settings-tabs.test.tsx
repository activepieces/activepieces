/**
 * @vitest-environment jsdom
 */
import { Permission } from '@activepieces/core-utils';
import { ProjectType } from '@activepieces/shared';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectSettingsDialog } from '@/app/components/project-settings';

const access = vi.hoisted(() => ({ granted: new Set<string>() }));
const project = vi.hoisted(() => ({ type: 'PERSONAL' }));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({
    checkAccess: (permission: string) => access.granted.has(permission),
  }),
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
  userHooks: { getCurrentUserPlatformRole: () => 'MEMBER' },
}));

vi.mock('@/features/projects', () => ({
  projectCollectionUtils: {
    useCurrentProject: () => ({
      project: {
        id: 'p1',
        type: project.type,
        displayName: 'Northwind',
        icon: { color: 'blue' },
        plan: null,
      },
    }),
    update: vi.fn(),
  },
}));

vi.mock('@/features/projects/components/ap-project-display', () => ({
  ApProjectDisplay: () => null,
}));

vi.mock('@/app/components/project-avatar', () => ({
  ProjectAvatar: () => null,
}));

vi.mock('@/components/ui/sonner', () => ({ INTERNAL_ERROR_MESSAGE: 'error' }));

vi.mock('@/lib/api', () => ({ api: {} }));

vi.mock('@/app/components/project-settings/form-defaults', () => ({
  projectSettingsFormDefaults: () => ({ projectName: 'Northwind' }),
}));

vi.mock('@/app/components/project-settings/general', () => ({
  GeneralSettings: () => <p>general settings</p>,
}));

vi.mock('@/app/components/project-settings/members', () => ({
  MembersSettings: () => <p>members settings</p>,
}));

vi.mock('@/app/components/project-settings/alerts', () => ({
  AlertsSettings: () => <p>alerts settings</p>,
}));

vi.mock('@/app/components/project-settings/pieces', () => ({
  PiecesSettings: () => <p>pieces settings</p>,
}));

vi.mock('@/app/components/project-settings/environment', () => ({
  EnvironmentSettings: () => <p>environment settings</p>,
}));

describe('ProjectSettingsDialog opened on a tab', () => {
  beforeEach(() => {
    access.granted = new Set();
    project.type = ProjectType.PERSONAL;
  });

  afterEach(cleanup);

  it('shows a tab the user can see', () => {
    project.type = ProjectType.TEAM;
    access.granted = new Set([Permission.READ_PROJECT_MEMBER]);

    renderOn({ tab: 'members' });

    expect(screen.getByText('members settings')).toBeTruthy();
  });

  it('does not show members to a user who cannot read them', () => {
    project.type = ProjectType.TEAM;

    renderOn({ tab: 'members' });

    expect(screen.queryByText('members settings')).toBeNull();
    expect(screen.getByText('general settings')).toBeTruthy();
  });

  it('does not show members on a personal project', () => {
    access.granted = new Set([Permission.READ_PROJECT_MEMBER]);

    renderOn({ tab: 'members' });

    expect(screen.queryByText('members settings')).toBeNull();
    expect(screen.getByText('pieces settings')).toBeTruthy();
  });

  it('does not show the environment without release access', () => {
    renderOn({ tab: 'environment' });

    expect(screen.queryByText('environment settings')).toBeNull();
  });
});

function renderOn({
  tab,
}: {
  tab: 'general' | 'members' | 'alerts' | 'pieces' | 'environment';
}) {
  render(
    <ProjectSettingsDialog
      open={true}
      onClose={() => undefined}
      initialTab={tab}
    />,
  );
}

import { InvitationType, ProjectType } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { inviteDefaults } from '@/features/members/lib/invite-defaults';

describe('inviteDefaults.invitationType', () => {
  it('starts on a platform invite when there is no current project', () => {
    expect(
      inviteDefaults.invitationType({
        isPlatformPage: false,
        projectRolesEnabled: true,
        projectType: null,
      }),
    ).toBe(InvitationType.PLATFORM);
  });

  it('starts on a platform invite on platform pages', () => {
    expect(
      inviteDefaults.invitationType({
        isPlatformPage: true,
        projectRolesEnabled: true,
        projectType: ProjectType.TEAM,
      }),
    ).toBe(InvitationType.PLATFORM);
  });

  it('starts on a project invite in a team project with project roles', () => {
    expect(
      inviteDefaults.invitationType({
        isPlatformPage: false,
        projectRolesEnabled: true,
        projectType: ProjectType.TEAM,
      }),
    ).toBe(InvitationType.PROJECT);
  });

  it('starts on a platform invite in a personal project or without project roles', () => {
    expect(
      inviteDefaults.invitationType({
        isPlatformPage: false,
        projectRolesEnabled: true,
        projectType: ProjectType.PERSONAL,
      }),
    ).toBe(InvitationType.PLATFORM);
    expect(
      inviteDefaults.invitationType({
        isPlatformPage: false,
        projectRolesEnabled: false,
        projectType: ProjectType.TEAM,
      }),
    ).toBe(InvitationType.PLATFORM);
  });
});

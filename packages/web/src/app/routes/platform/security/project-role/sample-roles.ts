import { ProjectRole, RoleType } from '@activepieces/core-utils';
import { PlatformWithoutSensitiveData } from '@activepieces/shared';

function isLocked(
  plan: Pick<PlatformWithoutSensitiveData['plan'], 'projectRolesEnabled'>,
): boolean {
  return !plan.projectRolesEnabled;
}

function sampleRoles(): ProjectRole[] {
  return SAMPLE_ROLES.map((entry, index) => ({
    ...entry,
    id: `sample-role-${index}`,
    created: SAMPLE_TIMESTAMP,
    updated: SAMPLE_TIMESTAMP,
    platformId: 'sample-platform',
  }));
}

export const rolesPlan = { isLocked, sampleRoles };

const SAMPLE_TIMESTAMP = '2026-01-01T00:00:00.000Z';

const SAMPLE_ROLES: Omit<
  ProjectRole,
  'id' | 'created' | 'updated' | 'platformId'
>[] = [
  {
    name: 'Admin',
    type: RoleType.DEFAULT,
    userCount: 4,
    permissions: [
      'READ_APP_CONNECTION',
      'WRITE_APP_CONNECTION',
      'READ_FLOW',
      'WRITE_FLOW',
      'UPDATE_FLOW_STATUS',
      'READ_PROJECT_MEMBER',
      'WRITE_PROJECT_MEMBER',
      'WRITE_INVITATION',
      'READ_INVITATION',
      'WRITE_PROJECT_RELEASE',
      'READ_PROJECT_RELEASE',
      'READ_RUN',
      'WRITE_RUN',
      'WRITE_ALERT',
      'READ_ALERT',
      'WRITE_PROJECT',
      'READ_PROJECT',
      'WRITE_FOLDER',
      'READ_FOLDER',
      'READ_TABLE',
      'WRITE_TABLE',
    ],
  },
  {
    name: 'Editor',
    type: RoleType.DEFAULT,
    userCount: 12,
    permissions: [
      'READ_APP_CONNECTION',
      'WRITE_APP_CONNECTION',
      'READ_FLOW',
      'WRITE_FLOW',
      'UPDATE_FLOW_STATUS',
      'READ_PROJECT_MEMBER',
      'READ_INVITATION',
      'READ_RUN',
      'WRITE_RUN',
      'READ_PROJECT',
      'WRITE_FOLDER',
      'READ_FOLDER',
      'READ_TABLE',
      'WRITE_TABLE',
    ],
  },
  {
    name: 'Viewer',
    type: RoleType.DEFAULT,
    userCount: 7,
    permissions: [
      'READ_APP_CONNECTION',
      'READ_FLOW',
      'READ_PROJECT_MEMBER',
      'READ_INVITATION',
      'READ_PROJECT',
      'READ_RUN',
      'READ_FOLDER',
      'READ_TABLE',
    ],
  },
  {
    name: 'Release manager',
    type: RoleType.CUSTOM,
    userCount: 3,
    permissions: [
      'READ_FLOW',
      'UPDATE_FLOW_STATUS',
      'READ_RUN',
      'WRITE_RUN',
      'READ_PROJECT_RELEASE',
      'WRITE_PROJECT_RELEASE',
      'READ_PROJECT',
    ],
  },
  {
    name: 'Connection manager',
    type: RoleType.CUSTOM,
    userCount: 2,
    permissions: [
      'READ_APP_CONNECTION',
      'WRITE_APP_CONNECTION',
      'READ_FLOW',
      'READ_RUN',
      'READ_PROJECT',
    ],
  },
];

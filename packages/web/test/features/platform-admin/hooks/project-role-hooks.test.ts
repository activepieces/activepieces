/**
 * @vitest-environment jsdom
 */
import { ProjectRole, RoleType, SeekPage } from '@activepieces/core-utils';
import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

import {
  projectRoleErrorMessage,
  withSavedRole,
} from '@/features/platform-admin/hooks/project-role-hooks';

const role = (overrides: Partial<ProjectRole>): ProjectRole => ({
  id: 'role-1',
  created: '2026-01-01T00:00:00.000Z',
  updated: '2026-01-01T00:00:00.000Z',
  name: 'Release manager',
  permissions: [],
  platformId: 'platform-1',
  type: RoleType.CUSTOM,
  userCount: 3,
  ...overrides,
});

const validationError = (message: string) =>
  new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 409,
    statusText: 'Conflict',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { code: 'VALIDATION', params: { message } },
  });

describe('projectRoleErrorMessage', () => {
  it('names the duplicate only when the server says the name is taken', () => {
    expect(
      projectRoleErrorMessage(
        validationError('Project role name already exists: Viewer'),
      ),
    ).toBe('A role with this name already exists');
  });

  it('shows the server text for any other validation error', () => {
    expect(
      projectRoleErrorMessage(validationError('Permissions are invalid')),
    ).toBe('Permissions are invalid');
  });
});

describe('withSavedRole', () => {
  it('replaces the saved role and keeps its people count', () => {
    const current: SeekPage<ProjectRole> = {
      data: [role({}), role({ id: 'role-2', name: 'Viewer' })],
      next: null,
      previous: null,
    };

    const next = withSavedRole({
      current,
      saved: role({
        name: 'Release lead',
        updated: '2026-02-01T00:00:00.000Z',
        userCount: undefined,
      }),
    });

    expect(next?.data[0].name).toBe('Release lead');
    expect(next?.data[0].updated).toBe('2026-02-01T00:00:00.000Z');
    expect(next?.data[0].userCount).toBe(3);
    expect(next?.data[1].name).toBe('Viewer');
  });
});

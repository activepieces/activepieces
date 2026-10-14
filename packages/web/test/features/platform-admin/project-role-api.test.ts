import { beforeEach, describe, expect, it, vi } from 'vitest';

import { projectRoleApi } from '@/features/platform-admin/api/project-role-api';

const state = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  api: {
    get: (...args: unknown[]) => state.get(...args),
    post: (...args: unknown[]) => state.post(...args),
    delete: (...args: unknown[]) => state.delete(...args),
  },
}));

describe('projectRoleApi paths', () => {
  beforeEach(() => {
    state.get.mockReset().mockResolvedValue({});
    state.post.mockReset().mockResolvedValue({});
    state.delete.mockReset().mockResolvedValue(undefined);
  });

  it('encodes the role name when deleting', async () => {
    await projectRoleApi.delete('QA r1 ?#🚀 مرحبا');
    expect(state.delete).toHaveBeenCalledWith(
      `/v1/project-roles/${encodeURIComponent('QA r1 ?#🚀 مرحبا')}`,
    );
    expect(state.delete.mock.calls[0][0]).not.toContain('?');
    expect(state.delete.mock.calls[0][0]).not.toContain('#');
  });

  it('encodes the id in get, update and member paths', async () => {
    await projectRoleApi.get('a?b');
    await projectRoleApi.update('a?b', { name: 'x' });
    await projectRoleApi.listProjectMembers('a?b', {});
    expect(state.get).toHaveBeenCalledWith('/v1/project-roles/a%3Fb');
    expect(state.post).toHaveBeenCalledWith('/v1/project-roles/a%3Fb', {
      name: 'x',
    });
    expect(state.get).toHaveBeenCalledWith(
      '/v1/project-roles/a%3Fb/project-members',
      {},
    );
  });
});

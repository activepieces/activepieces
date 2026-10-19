import { describe, expect, it, vi } from 'vitest';

import { projectRoleApi } from '@/features/platform-admin/api/project-role-api';

const state = vi.hoisted(() => ({ delete: vi.fn() }));

vi.mock('@/lib/api', () => ({
  api: { delete: (...args: unknown[]) => state.delete(...args) },
}));

describe('projectRoleApi.delete', () => {
  it('encodes the role name so ? and # cannot cut the path', async () => {
    state.delete.mockResolvedValue(undefined);
    await projectRoleApi.delete('QA r1 ?#🚀');
    expect(state.delete).toHaveBeenCalledWith(
      `/v1/project-roles/${encodeURIComponent('QA r1 ?#🚀')}`,
    );
  });
});

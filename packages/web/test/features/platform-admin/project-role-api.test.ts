import { expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({ api: { delete: vi.fn() } }));

import { projectRoleApi } from '@/features/platform-admin/api/project-role-api';
import { api } from '@/lib/api';

it('encodes ? # % in the role name when deleting', async () => {
  await projectRoleApi.delete('QA?x#y%z');
  expect(api.delete).toHaveBeenCalledWith('/v1/project-roles/QA%3Fx%23y%25z');
});

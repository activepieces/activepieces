import { describe, expect, it } from 'vitest';

import { rolesPlan } from '@/app/routes/platform/security/project-role/sample-roles';

describe('rolesPlan.isLocked', () => {
  it('locks the roles page when project roles are off', () => {
    expect(rolesPlan.isLocked({ projectRolesEnabled: false })).toBe(true);
  });

  it('keeps the roles page open when project roles are on, custom roles or not', () => {
    expect(rolesPlan.isLocked({ projectRolesEnabled: true })).toBe(false);
  });
});

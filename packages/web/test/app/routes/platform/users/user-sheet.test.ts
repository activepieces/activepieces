/**
 * @vitest-environment jsdom
 */
import { PlatformRole } from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

import { userFormSchema } from '@/app/routes/platform/users/user-sheet';

const values = {
  platformRole: PlatformRole.MEMBER,
  externalId: '',
  active: true,
};

describe('userFormSchema', () => {
  it('blocks clearing an external ID that is already set', () => {
    const result = userFormSchema({ hadExternalId: true }).safeParse(values);

    expect(result.success).toBe(false);
  });

  it('allows leaving the external ID empty when there was none', () => {
    const result = userFormSchema({ hadExternalId: false }).safeParse(values);

    expect(result.success).toBe(true);
  });
});

/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

import { newProjectFormSchema } from '@/features/projects/components/new-project-dialog';

describe('newProjectFormSchema', () => {
  it('keeps the sensitive flag and the global connections', () => {
    const parsed = newProjectFormSchema.parse({
      displayName: 'Finance',
      alertReceiverEmail: '',
      sensitive: true,
      globalConnectionExternalIds: ['slack-main'],
    });

    expect(parsed.sensitive).toBe(true);
    expect(parsed.globalConnectionExternalIds).toEqual(['slack-main']);
  });

  it('rejects a blank name', () => {
    const result = newProjectFormSchema.safeParse({ displayName: '   ' });

    expect(result.success).toBe(false);
  });
});

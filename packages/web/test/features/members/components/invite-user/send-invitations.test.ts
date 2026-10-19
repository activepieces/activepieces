import { describe, expect, it, vi } from 'vitest';

import { sendInvitations } from '@/features/members/components/invite-user/send-invitations';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/lib/mutation-feedback', () => ({
  mutationFeedback: {
    message: (error: unknown) =>
      error instanceof Error ? error.message : 'unknown',
    isQuotaExceeded: () => false,
  },
}));

function inviteFailing(failing: string[]) {
  return (email: string) =>
    failing.includes(email)
      ? Promise.reject(new Error(`rejected ${email}`))
      : Promise.resolve({ email });
}

describe('sendInvitations.sendAll', () => {
  it('keeps the sent invitations and lists each failed email with its reason', async () => {
    const outcome = await sendInvitations.sendAll({
      emails: ['a@x.com', 'b@x.com', 'c@x.com'],
      invite: inviteFailing(['b@x.com']),
    });
    expect(outcome.sent).toEqual([{ email: 'a@x.com' }, { email: 'c@x.com' }]);
    expect(
      outcome.failed.map(({ email, reason }) => ({ email, reason })),
    ).toEqual([{ email: 'b@x.com', reason: 'rejected b@x.com' }]);
  });

  it('lists every failed email with its reason when all of them fail', async () => {
    const outcome = await sendInvitations.sendAll({
      emails: ['a@x.com', 'b@x.com'],
      invite: inviteFailing(['a@x.com', 'b@x.com']),
    });
    expect(outcome.sent).toEqual([]);
    expect(outcome.failed.map(({ reason }) => reason)).toEqual([
      'rejected a@x.com',
      'rejected b@x.com',
    ]);
  });
});

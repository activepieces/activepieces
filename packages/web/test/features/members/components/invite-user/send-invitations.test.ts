import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  t: (key: string, params?: Record<string, unknown>) =>
    params ? `${key} ${JSON.stringify(params)}` : key,
}));

vi.mock('@/lib/mutation-feedback', () => ({
  mutationFeedback: {
    message: (error: unknown) =>
      error instanceof Error ? error.message : 'unknown',
  },
}));

import { sendInvitations } from '@/features/members/components/invite-user/send-invitations';

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

  it('returns no failures when every invitation is sent', async () => {
    const outcome = await sendInvitations.sendAll({
      emails: ['a@x.com', 'b@x.com'],
      invite: inviteFailing([]),
    });

    expect(outcome.failed).toEqual([]);
    expect(outcome.sent).toHaveLength(2);
  });

  it('throws the first error when every invitation fails', async () => {
    await expect(
      sendInvitations.sendAll({
        emails: ['a@x.com', 'b@x.com'],
        invite: inviteFailing(['a@x.com', 'b@x.com']),
      }),
    ).rejects.toThrow('rejected a@x.com');
  });
});

describe('sendInvitations.partialFailureCopy', () => {
  it('says how many of the total were sent and how many failed', () => {
    const copy = sendInvitations.partialFailureCopy({
      sentCount: 2,
      failedCount: 1,
    });

    expect(copy.title).toBe('invitationsSentOfTotal {"sent":2,"total":3}');
    expect(copy.description).toBe('invitationsFailedCheck {"count":1}');
  });
});

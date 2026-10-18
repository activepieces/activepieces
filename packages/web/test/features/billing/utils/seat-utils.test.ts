import { InvitationStatus, UserStatus } from '@activepieces/shared';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { seatUtils } from '@/features/billing/utils/seat-utils';

const NOW = new Date('2026-10-14T12:00:00Z');
const invite = ({ email, days = 1 }: { email: string; days?: number }) => ({
  email,
  status: InvitationStatus.PENDING,
  updated: dayjs(NOW).subtract(days, 'day').toISOString(),
});
const ACTIVE_AND_INACTIVE = [
  { email: 'a@x.com', status: UserStatus.ACTIVE },
  { email: 'b@x.com', status: UserStatus.INACTIVE },
];

describe('reserved seats', () => {
  it.each([
    {
      name: 'counts pending invitations like the server does',
      users: ACTIVE_AND_INACTIVE,
      invitations: [
        invite({ email: 'c@x.com' }),
        invite({ email: 'C@x.com' }),
      ],
      expected: 2,
    },
    {
      name: 'does not count an invitation for someone who is already a user',
      users: ACTIVE_AND_INACTIVE,
      invitations: [invite({ email: 'B@x.com' })],
      expected: 1,
    },
    {
      name: 'frees the seat of an invitation older than seven days',
      users: [{ email: 'a@x.com', status: UserStatus.ACTIVE }],
      invitations: [
        invite({ email: 'old@x.com', days: 8 }),
        invite({ email: 'new@x.com', days: 6 }),
      ],
      expected: 2,
    },
  ])('$name', ({ users, invitations, expected }) => {
    expect(seatUtils.reservedSeats({ users, invitations, now: NOW })).toBe(
      expected,
    );
  });
});

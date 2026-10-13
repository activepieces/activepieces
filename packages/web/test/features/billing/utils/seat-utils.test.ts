import { InvitationStatus, UserStatus } from '@activepieces/shared';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { seatUtils } from '@/features/billing/utils/seat-utils';

const NOW = new Date('2026-10-14T12:00:00Z');
const daysAgo = (days: number) =>
  dayjs(NOW).subtract(days, 'day').toISOString();
const invite = (
  email: string,
  days = 1,
  status = InvitationStatus.PENDING,
) => ({
  email,
  status,
  updated: daysAgo(days),
});

describe('reserved seats', () => {
  it('counts pending invitations like the server does', () => {
    expect(
      seatUtils.reservedSeats({
        users: [
          { email: 'a@x.com', status: UserStatus.ACTIVE },
          { email: 'b@x.com', status: UserStatus.INACTIVE },
        ],
        invitations: [invite('c@x.com'), invite('C@x.com')],
        now: NOW,
      }),
    ).toBe(2);
  });

  it('does not count an invitation for someone who is already a user', () => {
    expect(
      seatUtils.reservedSeats({
        users: [
          { email: 'a@x.com', status: UserStatus.ACTIVE },
          { email: 'b@x.com', status: UserStatus.INACTIVE },
        ],
        invitations: [invite('B@x.com')],
        now: NOW,
      }),
    ).toBe(1);
  });

  it('frees the seat of an invitation older than seven days', () => {
    expect(
      seatUtils.reservedSeats({
        users: [{ email: 'a@x.com', status: UserStatus.ACTIVE }],
        invitations: [invite('old@x.com', 8), invite('new@x.com', 6)],
        now: NOW,
      }),
    ).toBe(2);
  });
});

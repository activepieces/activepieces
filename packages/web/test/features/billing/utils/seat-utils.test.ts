import { UserStatus } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { seatUtils } from '@/features/billing/utils/seat-utils';

describe('reserved seats', () => {
  it('counts pending invitations like the server does', () => {
    expect(
      seatUtils.reservedSeats({
        users: [
          { email: 'a@x.com', status: UserStatus.ACTIVE },
          { email: 'b@x.com', status: UserStatus.INACTIVE },
        ],
        invitations: [{ email: 'c@x.com' }, { email: 'C@x.com' }],
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
        invitations: [{ email: 'B@x.com' }],
      }),
    ).toBe(1);
  });
});

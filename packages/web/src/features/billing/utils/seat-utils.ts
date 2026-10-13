import { UserStatus } from '@activepieces/shared';

function reservedSeats({
  users,
  invitations,
}: {
  users: { email: string; status: UserStatus }[];
  invitations: { email: string }[];
}): number {
  const active = users.filter((user) => user.status === UserStatus.ACTIVE);
  const known = new Set(users.map((user) => user.email.toLowerCase()));
  const pending = new Set(
    invitations
      .map((invitation) => invitation.email.toLowerCase())
      .filter((email) => !known.has(email)),
  );
  return active.length + pending.size;
}

export const seatUtils = { reservedSeats };

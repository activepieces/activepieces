import { InvitationStatus, UserStatus } from '@activepieces/shared';
import dayjs from 'dayjs';

function reservedSeats({
  users,
  invitations,
  now = new Date(),
}: {
  users: { email: string; status: UserStatus }[];
  invitations: {
    email: string;
    status: InvitationStatus;
    updated: string;
  }[];
  now?: Date;
}): number {
  const active = users.filter((user) => user.status === UserStatus.ACTIVE);
  const known = new Set(users.map((user) => user.email.toLowerCase()));
  const cutoff = dayjs(now).subtract(INVITATION_RESERVATION_DAYS, 'day');
  const pending = new Set(
    invitations
      .filter(
        (invitation) =>
          RESERVING_STATUSES.includes(invitation.status) &&
          dayjs(invitation.updated).isAfter(cutoff),
      )
      .map((invitation) => invitation.email.toLowerCase())
      .filter((email) => !known.has(email)),
  );
  return active.length + pending.size;
}

export const seatUtils = { reservedSeats };

const INVITATION_RESERVATION_DAYS = 7;
const RESERVING_STATUSES = [
  InvitationStatus.PENDING,
  InvitationStatus.ACCEPTED,
];

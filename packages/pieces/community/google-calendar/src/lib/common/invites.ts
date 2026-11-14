import { isNil } from '@activepieces/pieces-framework';
import { GoogleCalendarEvent } from './types';

function findSelfAttendee({
  event,
}: {
  event: GoogleCalendarEvent;
}): { responseStatus: string } | undefined {
  return (event.attendees ?? []).find((attendee) => attendee.self === true);
}

function createdTimeOf({ event }: { event: GoogleCalendarEvent }): number {
  const createdMs = Date.parse(event.created);
  return Number.isNaN(createdMs) ? Date.now() : createdMs;
}

const INVITE_LIMIT = 500;

export const calendarInvites = {
  isInvite({ event }: { event: GoogleCalendarEvent }): boolean {
    return (
      !isNil(event.organizer) &&
      event.organizer.self !== true &&
      !isNil(findSelfAttendee({ event }))
    );
  },
  judge({
    event,
    isKnown,
    isWholeSeriesInvite,
    inviteFloorMs,
  }: {
    event: GoogleCalendarEvent;
    isKnown: (id: string) => boolean;
    isWholeSeriesInvite: (id: string) => boolean;
    inviteFloorMs: number;
  }): InviteDecision {
    if (
      event.status === 'cancelled' ||
      findSelfAttendee({ event })?.responseStatus !== 'needsAction'
    ) {
      return 'answered';
    }
    if (isKnown(event.id)) {
      return 'seen';
    }
    if (event.recurringEventId && isWholeSeriesInvite(event.recurringEventId)) {
      return 'seen';
    }
    if (createdTimeOf({ event }) < inviteFloorMs) {
      return 'seen';
    }
    return 'new';
  },
  seriesOrder({ event }: { event: GoogleCalendarEvent }): number {
    return event.recurringEventId ? 1 : 0;
  },
  toSeen({ event }: { event: GoogleCalendarEvent }): SeenInvite[] {
    const createdMs = createdTimeOf({ event });
    const fired = { id: event.id, createdMs };
    return event.recurringEventId
      ? [fired, { id: event.recurringEventId, createdMs, viaOccurrence: true }]
      : [fired];
  },
  isWholeSeries({ entry }: { entry: SeenInvite | undefined }): boolean {
    return !isNil(entry) && entry.viaOccurrence !== true;
  },
  asWholeSeries({
    event,
    entry,
  }: {
    event: GoogleCalendarEvent;
    entry: SeenInvite | undefined;
  }): SeenInvite | undefined {
    if (isNil(entry) || entry.viaOccurrence !== true || event.recurringEventId) {
      return undefined;
    }
    return { id: entry.id, createdMs: entry.createdMs };
  },
  limit({
    invites,
    inviteFloorMs,
    trigger,
  }: {
    invites: SeenInvite[];
    inviteFloorMs: number;
    trigger: string;
  }): { invites: SeenInvite[]; inviteFloorMs: number } {
    if (invites.length <= INVITE_LIMIT) {
      return { invites, inviteFloorMs };
    }
    const newestFirst = [...invites].sort(
      (left, right) => right.createdMs - left.createdMs
    );
    const cutMs = newestFirst[INVITE_LIMIT - 1].createdMs;
    console.warn(
      `[google-calendar] ${trigger}: more than ${INVITE_LIMIT} unanswered invitations remembered; invitations to events created before ${new Date(
        cutMs
      ).toISOString()} no longer fire.`
    );
    return {
      invites: newestFirst.filter((entry) => entry.createdMs >= cutMs),
      inviteFloorMs: Math.max(inviteFloorMs, cutMs),
    };
  },
};

export type SeenInvite = {
  id: string;
  createdMs: number;
  viaOccurrence?: true;
};

export type InviteDecision = 'answered' | 'seen' | 'new';

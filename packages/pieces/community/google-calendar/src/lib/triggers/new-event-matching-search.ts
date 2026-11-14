import {
  createTrigger,
  isNil,
  Property,
  Store,
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { googleCalendarCommon, googleCalendarAuth } from '../common';
import { GoogleCalendarEvent } from '../common/types';
import { calendarInvites, SeenInvite } from '../common/invites';
import { eventScan, ListedEvent, ScanCheckpoint } from '../common/event-scan';
import { eventOutputSchema } from '../output-schemas';

const CHECKPOINT_STORE_KEY = 'matching_search_checkpoint';
const TRIGGER_NAME = 'new_event_matching_search';
const SAMPLE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const SAMPLE_SIZE = 5;

export const newEventMatchingSearch = createTrigger({
  auth: googleCalendarAuth,
  name: 'new_event_matching_search',
  classification: 'READ',
  displayName: 'New Event Matching Search',
  description:
    'Fires when a new event is created, or you are invited to one, that matches a specified search term.',
  aiMetadata: {
    description: 'Fires when a newly created event in the selected calendar, or a new invitation you have not answered yet (including an invitation to a single occurrence of someone else\'s recurring meeting), matches a required search term (matched across title, description, location, and attendees by default, or restricted to chosen fields). Edits, reschedules, cancellations and moved occurrences of your own events do not fire. Each fired item is the matching event; a new recurring series fires once, not once per occurrence. Can also be filtered by event type.',
  },
  propertyGroups: [
    {
      key: 'calendar',
      display: 'section',
      label: 'Calendar',
      icon: 'calendar',
      props: ['calendar_id'],
    },
    {
      key: 'search',
      display: 'section',
      label: 'Search',
      icon: 'filter',
      props: ['search_term'],
    },
  ],
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown(),
    search_term: Property.ShortText({
      displayName: 'Search Term',
      description: 'Matched against title, description, location and guests.',
      required: true,
    }),
    event_types: Property.StaticMultiSelectDropdown({
      displayName: 'Event Types',
      description: 'Leave empty to include every type.',
      required: false,
      advanced: true,
      options: {
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Birthday', value: 'birthday' },
          { label: 'Focus Time', value: 'focusTime' },
          { label: 'Out of Office', value: 'outOfOffice' },
          { label: 'Working Location', value: 'workingLocation' },
          { label: 'From Gmail', value: 'fromGmail' },
        ],
      },
    }),
    search_fields: Property.StaticMultiSelectDropdown({
      displayName: 'Search In',
      description: 'Leave empty to search every field.',
      required: false,
      advanced: true,
      options: {
        options: [
          { label: 'Event Title/Summary', value: 'summary' },
          { label: 'Event Description', value: 'description' },
          { label: 'Event Location', value: 'location' },
          { label: 'Attendee Names/Emails', value: 'attendees' },
        ],
      },
    }),
  },
  outputSchema: eventOutputSchema,
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'abc123def456',
    summary: 'Final Project Review',
    description: 'Review of the Q3 final project deliverables.',
    status: 'confirmed',
    created: '2025-08-14T09:05:00.000Z',
    updated: '2025-08-14T09:05:01.000Z',
    start: { dateTime: '2025-09-01T10:00:00-07:00' },
    end: { dateTime: '2025-09-01T11:30:00-07:00' },
    organizer: { email: 'project.manager@example.com' },
  },

  async onEnable(context) {
    const watchKey = buildWatchKey({ propsValue: context.propsValue });
    if (context.isRepublish) {
      const existing = await readCheckpoint({ store: context.store, watchKey });
      if (!isNil(existing)) {
        await context.store.put<MatchingSearchCheckpoint>(
          CHECKPOINT_STORE_KEY,
          existing
        );
        return;
      }
    }
    await saveBaseline({ store: context.store, watchKey });
  },

  async onDisable() {
    return;
  },

  async run(context) {
    const { calendar_id, search_term, event_types, search_fields } =
      context.propsValue;
    if (!calendar_id || !search_term) {
      return [];
    }
    const deadlineMs = Date.now() + eventScan.listingBudgetMs;
    const watchKey = buildWatchKey({ propsValue: context.propsValue });
    const checkpoint = await readCheckpoint({ store: context.store, watchKey });
    if (isNil(checkpoint)) {
      await saveBaseline({ store: context.store, watchKey });
      return [];
    }

    const scan = await eventScan.scanUpdatedEvents({
      auth: context.auth,
      calendarId: calendar_id,
      query: { q: search_term },
      eventTypes: event_types,
      checkpoint,
      deadlineMs,
      triggerName: TRIGGER_NAME,
    });

    if (scan.kind === 'expired') {
      eventScan.warnExpired({
        triggerName: TRIGGER_NAME,
        skippedItems: 'Matching events created',
        scannedThroughMs: checkpoint.scannedThroughMs,
      });
      await saveBaseline({ store: context.store, watchKey });
      return [];
    }

    const judged = judgeListed({
      listed: scan.listed,
      createdFloorMs: checkpoint.createdFloorMs,
      invites: checkpoint.invites,
      inviteFloorMs: checkpoint.inviteFloorMs,
      searchTerm: search_term,
      searchFields: search_fields,
    });

    await context.store.put<MatchingSearchCheckpoint>(CHECKPOINT_STORE_KEY, {
      ...scan.checkpoint,
      ...calendarInvites.limit({
        invites: judged.invites,
        inviteFloorMs: checkpoint.inviteFloorMs,
        trigger: TRIGGER_NAME,
      }),
    });

    return judged.fired;
  },

  async test(context) {
    const { calendar_id, search_term, event_types, search_fields } =
      context.propsValue;
    if (!calendar_id || !search_term) {
      return [];
    }
    const sampleFromMs = Date.now() - SAMPLE_WINDOW_MS;
    const listed = await eventScan.sampleUpdatedEvents({
      auth: context.auth,
      calendarId: calendar_id,
      query: { q: search_term },
      eventTypes: event_types,
      lookbackMs: SAMPLE_WINDOW_MS,
      triggerName: TRIGGER_NAME,
    });
    return judgeListed({
      listed,
      createdFloorMs: sampleFromMs,
      invites: [],
      inviteFloorMs: 0,
      searchTerm: search_term,
      searchFields: search_fields,
    })
      .fired.sort((left, right) => Date.parse(right.created) - Date.parse(left.created))
      .slice(0, SAMPLE_SIZE);
  },
});

function judgeListed({
  listed,
  createdFloorMs,
  invites,
  inviteFloorMs,
  searchTerm,
  searchFields,
}: {
  listed: ListedEvent[];
  createdFloorMs: number;
  invites: SeenInvite[];
  inviteFloorMs: number;
  searchTerm: string;
  searchFields: string[] | undefined;
}): { fired: GoogleCalendarEvent[]; invites: SeenInvite[] } {
  const invitesById = new Map(invites.map((entry) => [entry.id, entry]));
  const fired: GoogleCalendarEvent[] = [];
  const mastersFirst = [...listed].sort(
    (left, right) =>
      calendarInvites.seriesOrder({ event: left.event }) -
      calendarInvites.seriesOrder({ event: right.event })
  );
  for (const { event, firstSight } of mastersFirst) {
    if (event.status === 'cancelled') {
      invitesById.delete(event.id);
    }
    if (calendarInvites.isInvite({ event })) {
      const matches = matchesSearchFields({ event, searchTerm, searchFields });
      const decision = calendarInvites.judge({
        event,
        isKnown: (id) => invitesById.has(id),
        isWholeSeriesInvite: (id) =>
          calendarInvites.isWholeSeries({ entry: invitesById.get(id) }),
        inviteFloorMs,
      });
      if (decision === 'answered') {
        invitesById.delete(event.id);
      }
      if (decision === 'seen' && matches) {
        const upgraded = calendarInvites.asWholeSeries({
          event,
          entry: invitesById.get(event.id),
        });
        if (!isNil(upgraded)) {
          invitesById.set(upgraded.id, upgraded);
        }
      }
      if (decision === 'new') {
        rememberNewInvite({ event, matches }).forEach((entry) =>
          invitesById.set(entry.id, entry)
        );
        if (matches) {
          fired.push(event);
        }
      }
      continue;
    }
    if (
      firstSight &&
      isNewOwnEvent({ event, createdFloorMs }) &&
      matchesSearchFields({ event, searchTerm, searchFields })
    ) {
      fired.push(event);
    }
  }
  return { fired, invites: Array.from(invitesById.values()) };
}

function rememberNewInvite({
  event,
  matches,
}: {
  event: GoogleCalendarEvent;
  matches: boolean;
}): SeenInvite[] {
  const entries = calendarInvites.toSeen({ event });
  if (matches) {
    return entries;
  }
  return entries.map((entry) => ({ ...entry, viaOccurrence: true }));
}

function isNewOwnEvent({
  event,
  createdFloorMs,
}: {
  event: GoogleCalendarEvent;
  createdFloorMs: number;
}): boolean {
  return (
    eventScan.createdTimeOf({ event }) >= createdFloorMs &&
    event.status !== 'cancelled' &&
    !event.recurringEventId
  );
}

function matchesSearchFields({
  event,
  searchTerm,
  searchFields,
}: {
  event: GoogleCalendarEvent;
  searchTerm: string;
  searchFields: string[] | undefined;
}): boolean {
  if (!searchFields || searchFields.length === 0) {
    return true;
  }
  const searchTermLower = searchTerm.toLowerCase();
  return searchFields.some((field) => {
    switch (field) {
      case 'summary':
        return event.summary?.toLowerCase().includes(searchTermLower) || false;
      case 'description':
        return (
          event.description?.toLowerCase().includes(searchTermLower) || false
        );
      case 'location':
        return event.location?.toLowerCase().includes(searchTermLower) || false;
      case 'attendees':
        return (
          event.attendees?.some(
            (attendee) =>
              attendee.email?.toLowerCase().includes(searchTermLower) ||
              attendee.displayName?.toLowerCase().includes(searchTermLower)
          ) || false
        );
      default:
        return false;
    }
  });
}

async function readCheckpoint({
  store,
  watchKey,
}: {
  store: Store;
  watchKey: string;
}): Promise<MatchingSearchCheckpoint | null> {
  const base = await eventScan.readCheckpoint({
    store,
    storeKey: CHECKPOINT_STORE_KEY,
    watchKey,
    triggerName: TRIGGER_NAME,
  });
  if (isNil(base)) {
    return null;
  }
  const saved = await store.get<MatchingSearchCheckpoint>(CHECKPOINT_STORE_KEY);
  if (!isNil(saved)) {
    return { ...base, ...(await readStoredInvites({ store })) };
  }
  const legacyLastPoll = await eventScan.readLegacyLastPoll({ store });
  return {
    ...base,
    invites: [],
    inviteFloorMs: isNil(legacyLastPoll) ? 0 : legacyLastPoll + 1,
  };
}

async function saveBaseline({
  store,
  watchKey,
}: {
  store: Store;
  watchKey: string;
}): Promise<void> {
  const carried = await readStoredInvites({ store });
  await store.put<MatchingSearchCheckpoint>(CHECKPOINT_STORE_KEY, {
    ...eventScan.baselineCheckpoint({ watchKey }),
    invites: carried.invites,
    inviteFloorMs: carried.inviteFloorMs,
  });
}

async function readStoredInvites({
  store,
}: {
  store: Store;
}): Promise<Pick<MatchingSearchCheckpoint, 'invites' | 'inviteFloorMs'>> {
  const saved = await store.get<MatchingSearchCheckpoint>(CHECKPOINT_STORE_KEY);
  return {
    invites: Array.isArray(saved?.invites) ? saved.invites : [],
    inviteFloorMs:
      typeof saved?.inviteFloorMs === 'number' ? saved.inviteFloorMs : 0,
  };
}

function buildWatchKey({
  propsValue,
}: {
  propsValue: {
    calendar_id?: string;
    search_term?: string;
    event_types?: string[];
  };
}): string {
  return JSON.stringify([
    propsValue.calendar_id ?? '',
    propsValue.search_term ?? '',
    [...(propsValue.event_types ?? [])].sort(),
  ]);
}

type MatchingSearchCheckpoint = ScanCheckpoint & {
  invites: SeenInvite[];
  inviteFloorMs: number;
};

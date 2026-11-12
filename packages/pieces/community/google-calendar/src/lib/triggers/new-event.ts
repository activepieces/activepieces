import {
  createTrigger,
  DEDUPE_KEY_PROPERTY,
  TriggerStrategy,
  Property,
  tryCatch,
  WebhookRenewStrategy,
  Store,
} from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/pieces-framework';
import {
  googleCalendarCommon,
  googleCalendarAuth,
  GoogleCalendarAuthValue,
} from '../common';
import {
  stopWatchEvent,
  watchEvent,
  listRecentLiveEvents,
  getInitialSyncToken,
  listEventsWithSyncToken,
  listEventsForFullSync,
} from '../common/helper';
import { GoogleWatchResponse, GoogleCalendarEvent } from '../common/types';
import { calendarInvites, SeenInvite } from '../common/invites';
import { eventScan } from '../common/event-scan';
import { eventOutputSchema } from '../output-schemas';

const WATCH_STORE_KEY = 'google_calendar_watch';
const SYNC_TOKEN_STORE_KEY = 'google_calendar_sync_token';
const CALENDAR_ID_STORE_KEY = 'google_calendar_new_event_calendar_id';
const LEGACY_SEEN_EVENT_IDS_STORE_KEY = 'google_calendar_seen_event_ids';
const STATE_STORE_KEY = 'google_calendar_new_event_state';
const SEEN_EVENTS_LIMIT = 500;
const SAMPLE_SIZE = 5;

type EventFilters = {
  event_types: string[] | undefined;
  search_filter: string | undefined;
  exclude_all_day: boolean | undefined;
};

function matchesFilters(
  event: GoogleCalendarEvent,
  { event_types, search_filter, exclude_all_day }: EventFilters
): boolean {
  if (event_types && event_types.length > 0) {
    const eventType = event.eventType || 'default';
    if (!event_types.includes(eventType)) {
      return false;
    }
  }

  if (search_filter && search_filter.trim()) {
    const searchTerm = search_filter.toLowerCase().trim();
    const summary = (event.summary || '').toLowerCase();
    const description = (event.description || '').toLowerCase();
    const location = (event.location || '').toLowerCase();

    const matchesSearch =
      summary.includes(searchTerm) ||
      description.includes(searchTerm) ||
      location.includes(searchTerm);

    if (!matchesSearch) {
      return false;
    }
  }

  if (exclude_all_day) {
    const isAllDay = event.start?.date && !event.start?.dateTime;
    if (isAllDay) {
      return false;
    }
  }

  return true;
}

export const newEvent = createTrigger({
  auth: googleCalendarAuth,
  name: 'new_event',
  classification: 'READ',
  displayName: 'New Event',
  description:
    'Fires when a new event is created in a calendar, or when you are invited to one.',
  aiMetadata: {
    description:
      "Fires when a brand-new event is created in the selected calendar after the trigger was turned on, and when you receive a new invitation you have not answered yet (including an invitation to a single occurrence of someone else's recurring meeting), via Google push notifications. Edits, reschedules, renames, cancellations and moved occurrences of your own events do not fire; a new recurring series fires once. Each fired item is the new event; can be narrowed by event type, a text search across title/description/location, and an option to skip all-day events.",
  },
  propertyGroups: [
    {
      key: 'calendar',
      display: 'section',
      label: 'Calendar',
      icon: 'calendar',
      props: ['calendar_id'],
    },
  ],
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown('writer'),
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
    search_filter: Property.ShortText({
      displayName: 'Search Filter',
      description:
        'Only events whose title, description or location contain this.',
      required: false,
      advanced: true,
    }),
    exclude_all_day: Property.Checkbox({
      displayName: 'Exclude All-Day Events',
      description: 'Skips all-day events.',
      required: false,
      advanced: true,
      defaultValue: false,
    }),
  },
  outputSchema: eventOutputSchema,
  type: TriggerStrategy.WEBHOOK,
  renewConfiguration: {
    strategy: WebhookRenewStrategy.CRON,
    cronExpression: '0 */12 * * *',
  },
  sampleData: {
    kind: 'calendar#event',
    etag: '"3419997894982000"',
    id: 'sample_event_id_12345',
    status: 'confirmed',
    htmlLink:
      'https://www.google.com/calendar/event?eid=c2FtcGxlX2V2ZW50X2lkXzEyMzQ1',
    created: '2025-08-15T11:02:27.000Z',
    updated: '2025-08-15T11:02:27.491Z',
    summary: 'Team Sync',
    creator: { email: 'creator@example.com' },
    organizer: {
      email: 'creator@example.com',
      self: true,
    },
    start: {
      dateTime: '2025-08-18T10:00:00-07:00',
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: '2025-08-18T11:00:00-07:00',
      timeZone: 'America/Los_Angeles',
    },
    iCalUID: 'sample_event_id_12345@google.com',
    sequence: 0,
    reminders: { useDefault: true },
    eventType: 'default',
  },

  async onEnable(context) {
    const calendarId = context.propsValue.calendar_id!;
    const auth = context.auth as GoogleCalendarAuthValue;
    const enableStartedMs = Date.now();

    const resumable = await resumableAfterRepublish({
      isRepublish: readIsRepublish(context),
      store: context.store,
      calendarId,
    });

    const initialSyncToken = resumable
      ? null
      : await getInitialSyncToken({
          calendarId,
          authProp: auth,
        });

    const response = await watchEvent(calendarId, context.webhookUrl, auth);

    const { error } = await tryCatch(async () => {
      await context.store.put<GoogleWatchResponse>(WATCH_STORE_KEY, response);
      await context.store.put<string>(CALENDAR_ID_STORE_KEY, calendarId);
      if (resumable) {
        return;
      }
      const carried = await readState({ store: context.store });
      await context.store.put<NewEventState>(STATE_STORE_KEY, {
        seen: [],
        createdFloorMs: enableStartedMs,
        invites: carried.invites,
        inviteFloorMs: carried.inviteFloorMs,
      });
      if (!isNil(initialSyncToken)) {
        await context.store.put<string>(SYNC_TOKEN_STORE_KEY, initialSyncToken);
      }
    });
    if (error) {
      const stopped = await tryCatch(() => stopWatchEvent(response, auth));
      if (stopped.error) {
        console.warn(
          `[google-calendar] new_event: could not stop channel ${response.id} after enabling failed; it expires on its own.`,
          stopped.error
        );
      }
      throw error;
    }
  },

  async onDisable(context) {
    const auth = context.auth as GoogleCalendarAuthValue;
    const watch = await context.store.get<GoogleWatchResponse>(WATCH_STORE_KEY);

    if (watch) {
      await stopWatchEvent(watch, auth);
    }
    if (readIsRepublish(context)) {
      await context.store.delete(WATCH_STORE_KEY);
      return;
    }
    const carried = await readState({ store: context.store });
    await context.store.put<NewEventState>(STATE_STORE_KEY, {
      seen: [],
      createdFloorMs: null,
      invites: carried.invites,
      inviteFloorMs: carried.inviteFloorMs,
    });
    await context.store.delete(SYNC_TOKEN_STORE_KEY);
    await context.store.delete(LEGACY_SEEN_EVENT_IDS_STORE_KEY);
  },

  async onRenew(context) {
    const calendarId = context.propsValue.calendar_id!;
    const auth = context.auth as GoogleCalendarAuthValue;

    const existingWatch = await context.store.get<GoogleWatchResponse>(
      WATCH_STORE_KEY
    );
    const renewed = await watchEvent(calendarId, context.webhookUrl, auth);
    const saved = await tryCatch(() =>
      context.store.put<GoogleWatchResponse>(WATCH_STORE_KEY, renewed)
    );
    if (saved.error) {
      const stopped = await tryCatch(() => stopWatchEvent(renewed, auth));
      if (stopped.error) {
        console.warn(
          `[google-calendar] new_event: could not stop channel ${renewed.id} after saving it failed; it expires on its own.`,
          stopped.error
        );
      }
      throw saved.error;
    }
    if (!isNil(existingWatch)) {
      const stopped = await tryCatch(() => stopWatchEvent(existingWatch, auth));
      if (stopped.error) {
        console.warn(
          `[google-calendar] new_event: could not stop the previous channel ${existingWatch.id}; it expires on its own and its notifications are ignored.`,
          stopped.error
        );
      }
    }
  },

  async run(context) {
    const payload = context.payload;
    const headers = payload.headers as Record<string, string>;
    const resourceState = headers['x-goog-resource-state'];
    const filters: EventFilters = {
      event_types: context.propsValue.event_types,
      search_filter: context.propsValue.search_filter,
      exclude_all_day: context.propsValue.exclude_all_day,
    };

    if (resourceState === 'sync') {
      return [];
    }

    if (resourceState !== 'exists') {
      return [];
    }

    const channelId = headers['x-goog-channel-id'];
    if (!isNil(channelId)) {
      const registeredWatch = await context.store.get<GoogleWatchResponse>(
        WATCH_STORE_KEY
      );
      if (!isNil(registeredWatch) && registeredWatch.id !== channelId) {
        return [];
      }
    }

    const calendarId = context.propsValue.calendar_id!;
    const auth = context.auth as GoogleCalendarAuthValue;
    const syncToken = await context.store.get<string>(SYNC_TOKEN_STORE_KEY);
    if (isNil(syncToken)) {
      const fresh = await getInitialSyncToken({
        calendarId,
        authProp: auth,
        deadlineMs: Date.now() + eventScan.listingBudgetMs,
      });
      if (!isNil(fresh)) {
        await context.store.put<string>(SYNC_TOKEN_STORE_KEY, fresh);
      }
      return [];
    }

    const incremental = await listEventsWithSyncToken({
      calendarId,
      syncToken,
      authProp: auth,
    });
    const { items, nextSyncToken } = incremental.syncTokenInvalid
      ? await listChangedSinceTurnOn({
          calendarId,
          auth,
          store: context.store,
        })
      : incremental;

    const newEvents = await judgeEvents({
      items,
      store: context.store,
      filters,
    });

    if (!isNil(nextSyncToken)) {
      const saved = await tryCatch(() =>
        context.store.put<string>(SYNC_TOKEN_STORE_KEY, nextSyncToken)
      );
      if (saved.error) {
        console.warn(
          '[google-calendar] new_event: could not save the sync token; the next notification re-lists the same changes and already-seen events will not fire twice.',
          saved.error
        );
      }
    }

    return newEvents.map((event) => ({
      ...event,
      [DEDUPE_KEY_PROPERTY]: event.id,
    }));
  },

  async test(context) {
    const auth = context.auth as GoogleCalendarAuthValue;
    const filters: EventFilters = {
      event_types: context.propsValue.event_types,
      search_filter: context.propsValue.search_filter,
      exclude_all_day: context.propsValue.exclude_all_day,
    };

    return listRecentLiveEvents({
      calendarId: context.propsValue.calendar_id!,
      authProp: auth,
      keep: (event) => matchesFilters(event, filters),
      limit: SAMPLE_SIZE,
    });
  },
});

async function judgeEvents({
  items,
  store,
  filters,
}: {
  items: GoogleCalendarEvent[];
  store: Store;
  filters: EventFilters;
}): Promise<GoogleCalendarEvent[]> {
  const state = await readState({ store });
  const storedFloorMs = state.createdFloorMs;
  const createdFloorMs = isNil(storedFloorMs) ? Date.now() : storedFloorMs;
  const storedSeen = state.seen;
  const storedInvites = state.invites;
  const inviteFloorMs = state.inviteFloorMs;
  const seenById = new Map(storedSeen.map((entry) => [entry.id, entry]));
  const invitesById = new Map(storedInvites.map((entry) => [entry.id, entry]));
  const isKnown = (id: string) => seenById.has(id) || invitesById.has(id);
  const newEvents: GoogleCalendarEvent[] = [];
  const mastersFirst = [...items].sort(
    (left, right) =>
      calendarInvites.seriesOrder({ event: left }) -
      calendarInvites.seriesOrder({ event: right })
  );
  for (const event of mastersFirst) {
    if (!event.id) {
      continue;
    }
    if (event.status === 'cancelled' && invitesById.has(event.id)) {
      invitesById.delete(event.id);
      continue;
    }
    if (calendarInvites.isInvite({ event })) {
      const decision = calendarInvites.judge({
        event,
        isKnown,
        isWholeSeriesInvite: (id) =>
          calendarInvites.isWholeSeries({ entry: invitesById.get(id) }),
        inviteFloorMs,
      });
      if (decision === 'answered') {
        invitesById.delete(event.id);
      }
      if (decision === 'seen') {
        const upgraded = calendarInvites.asWholeSeries({
          event,
          entry: invitesById.get(event.id),
        });
        if (!isNil(upgraded)) {
          invitesById.set(upgraded.id, upgraded);
        }
      }
      if (decision === 'new') {
        calendarInvites
          .toSeen({ event })
          .forEach((entry) => invitesById.set(entry.id, entry));
        if (matchesFilters(event, filters)) {
          newEvents.push(event);
        }
      }
      continue;
    }
    if (
      event.status === 'cancelled' ||
      event.recurringEventId ||
      isKnown(event.id)
    ) {
      continue;
    }
    const createdMs = Date.parse(event.created);
    if (!Number.isNaN(createdMs) && createdMs < createdFloorMs) {
      continue;
    }
    seenById.set(event.id, {
      id: event.id,
      createdMs: Number.isNaN(createdMs) ? Date.now() : createdMs,
    });
    if (matchesFilters(event, filters)) {
      newEvents.push(event);
    }
  }
  const limited = limitSeenEvents({
    seen: Array.from(seenById.values()),
    createdFloorMs,
  });
  const limitedInvites = calendarInvites.limit({
    invites: Array.from(invitesById.values()),
    inviteFloorMs,
    trigger: 'new_event',
  });
  if (
    !state.fromStateKey ||
    isNil(storedFloorMs) ||
    limited.createdFloorMs !== createdFloorMs ||
    limited.seen.length !== storedSeen.length ||
    limitedInvites.inviteFloorMs !== inviteFloorMs ||
    !sameInvites({ left: limitedInvites.invites, right: storedInvites })
  ) {
    await store.put<NewEventState>(STATE_STORE_KEY, {
      seen: limited.seen,
      createdFloorMs: limited.createdFloorMs,
      invites: limitedInvites.invites,
      inviteFloorMs: limitedInvites.inviteFloorMs,
    });
  }
  return newEvents;
}

async function listChangedSinceTurnOn({
  calendarId,
  auth,
  store,
}: {
  calendarId: string;
  auth: GoogleCalendarAuthValue;
  store: Store;
}): Promise<{
  items: GoogleCalendarEvent[];
  nextSyncToken: string | undefined;
}> {
  const { createdFloorMs } = await readState({ store });
  const sinceMs = isNil(createdFloorMs) ? Date.now() : createdFloorMs;
  const full = await listEventsForFullSync({
    calendarId,
    authProp: auth,
    withItems: true,
    keepItem: (event) => changedSince({ event, sinceMs }),
    deadlineMs: Date.now() + eventScan.listingBudgetMs,
  });
  if (full.complete) {
    console.warn(
      `[google-calendar] new_event: Google answered 410 (sync token no longer valid); ran a full re-sync and checked ${full.items.length} events changed since the trigger was turned on. Only events created since turn-on that were not seen yet fire.`
    );
    return { items: full.items, nextSyncToken: full.nextSyncToken };
  }
  const nextSyncToken = await getInitialSyncToken({
    calendarId,
    authProp: auth,
    deadlineMs: Date.now() + eventScan.listingBudgetMs,
  });
  if (isNil(nextSyncToken)) {
    throw new Error(
      `Google Calendar answered 410 (sync token no longer valid) and the calendar is too large to re-sync within ${
        eventScan.listingBudgetMs / 1000
      } s. The trigger keeps its previous state and retries at the next notification.`
    );
  }
  console.warn(
    `[google-calendar] new_event: Google answered 410 (sync token no longer valid) and the full re-sync did not finish within ${
      eventScan.listingBudgetMs / 1000
    } s; checked ${full.items.length} events, then re-synced from now without listing the rest. Other events created between ${new Date(
      sinceMs
    ).toISOString()} and now were skipped and will not fire.`
  );
  return { items: full.items, nextSyncToken };
}

async function readState({
  store,
}: {
  store: Store;
}): Promise<NewEventState & { fromStateKey: boolean }> {
  const saved = await store.get<NewEventState>(STATE_STORE_KEY);
  if (!isNil(saved) && Array.isArray(saved.seen)) {
    return {
      seen: saved.seen,
      createdFloorMs:
        typeof saved.createdFloorMs === 'number' ? saved.createdFloorMs : null,
      invites: Array.isArray(saved.invites) ? saved.invites : [],
      inviteFloorMs:
        typeof saved.inviteFloorMs === 'number' ? saved.inviteFloorMs : 0,
      fromStateKey: true,
    };
  }
  return {
    seen: [],
    createdFloorMs: null,
    invites: [],
    inviteFloorMs: 0,
    fromStateKey: false,
  };
}

function changedSince({
  event,
  sinceMs,
}: {
  event: GoogleCalendarEvent;
  sinceMs: number;
}): boolean {
  const updatedMs = Date.parse(event.updated);
  return Number.isNaN(updatedMs) || updatedMs >= sinceMs;
}

function sameInvites({
  left,
  right,
}: {
  left: SeenInvite[];
  right: SeenInvite[];
}): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const rightKeys = new Set(right.map((entry) => inviteKey({ entry })));
  return left.every((entry) => rightKeys.has(inviteKey({ entry })));
}

function inviteKey({ entry }: { entry: SeenInvite }): string {
  return `${entry.id}:${entry.viaOccurrence === true ? 'occurrence' : 'whole'}`;
}

function limitSeenEvents({
  seen,
  createdFloorMs,
}: {
  seen: SeenEvent[];
  createdFloorMs: number;
}): { seen: SeenEvent[]; createdFloorMs: number } {
  const newestFirst = [...seen].sort(
    (left, right) => right.createdMs - left.createdMs
  );
  const fitting = eventScan.fittingCount({
    entries: newestFirst,
    maxEntries: SEEN_EVENTS_LIMIT,
    maxChars: eventScan.seenMaxChars,
  });
  if (fitting === newestFirst.length) {
    return { seen, createdFloorMs };
  }
  const cutMs = newestFirst[fitting].createdMs;
  console.warn(
    `[google-calendar] new_event: more new events than the saved state can hold (${newestFirst.length}); events created at or before ${new Date(
      cutMs
    ).toISOString()} no longer fire.`
  );
  return {
    seen: newestFirst.filter((entry) => entry.createdMs > cutMs),
    createdFloorMs: Math.max(createdFloorMs, cutMs + 1),
  };
}

type SeenEvent = {
  id: string;
  createdMs: number;
};

type NewEventState = {
  seen: SeenEvent[];
  createdFloorMs: number | null;
  invites: SeenInvite[];
  inviteFloorMs: number;
};

function readIsRepublish(context: unknown): boolean {
  return (context as { isRepublish?: boolean }).isRepublish === true;
}

async function resumableAfterRepublish({
  isRepublish,
  store,
  calendarId,
}: {
  isRepublish: boolean;
  store: Store;
  calendarId: string;
}): Promise<boolean> {
  if (!isRepublish) {
    return false;
  }
  const [token, savedCalendarId] = await Promise.all([
    store.get<string>(SYNC_TOKEN_STORE_KEY),
    store.get<string>(CALENDAR_ID_STORE_KEY),
  ]);
  return !isNil(token) && savedCalendarId === calendarId;
}

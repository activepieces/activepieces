import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  isNil,
  Property,
  Store,
  tryCatch,
} from '@activepieces/pieces-framework';
import { specificEvent } from '../common/specific-event';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import {
  googleCalendarCommon,
  googleCalendarAuth,
  getAccessToken,
} from '../common';
import { GoogleCalendarEvent } from '../common/types';
import { eventScan, ListedEvent } from '../common/event-scan';
import { eventOutputSchema } from '../output-schemas';

const CHECKPOINT_STORE_KEY = 'event_cancelled_checkpoint';
const PINNED_STORE_KEY = 'event_cancelled_pinned';
const TRIGGER_NAME = 'event_cancelled';
const SAMPLE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const SAMPLE_SIZE = 5;
const RESCHEDULED_WORD = 'rescheduled';
const CANCELLATION_QUERY: Record<string, string> = {
  showDeleted: 'true',
  singleEvents: 'false',
};

export const eventCancelled = createTrigger({
  auth: googleCalendarAuth,
  name: 'event_cancelled',
  classification: 'READ',
  displayName: 'Event Cancelled',
  description: 'Fires when an event is canceled or deleted.',
  aiMetadata: {
    description:
      'Fires when an event in the selected calendar is cancelled or deleted, detected by polling. Each fired item is the cancelled event. Deleting a whole recurring series fires once for the series; cancelling one occurrence fires once for that occurrence. Optionally scoped to one specific event, and filtered by cancellation reason. Each cancellation has exactly one reason, checked in this order: rescheduled (the title or description contains "rescheduled"), declined (an attendee declined), deleted (you organize the event, or Google returned only its id), other (someone else cancelled a meeting you were invited to).',
  },
  propertyGroups: [
    {
      key: 'event',
      display: 'section',
      label: 'Event',
      icon: 'calendar',
      props: ['calendar_id', 'specific_event', 'event_id'],
    },
  ],
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown(),
    specific_event: Property.Checkbox({
      displayName: 'Target Specific Event',
      description: 'Watch one event instead of the whole calendar.',
      required: false,
      defaultValue: false,
    }),
    event_id: googleCalendarCommon.eventDropdown(false),
    cancellation_reason: Property.StaticMultiSelectDropdown({
      displayName: 'Cancellation Reasons',
      description:
        'Leave empty to fire on every cancellation. Each cancellation has one reason, checked in this order: Rescheduled (title or description says "rescheduled"), Attendee Declined, Event Deleted (you organize it, or only its id is left), Other (someone else cancelled a meeting you were invited to).',
      required: false,
      advanced: true,
      options: {
        options: [
          { label: 'Event Deleted', value: 'deleted' },
          { label: 'Attendee Declined', value: 'declined' },
          { label: 'Event Rescheduled', value: 'rescheduled' },
          { label: 'Other Cancellations', value: 'other' },
        ],
      },
    }),
  },
  outputSchema: eventOutputSchema,
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'abc123def456_cancelled',
    summary: 'Cancelled: Q3 Planning Session',
    status: 'cancelled',
    created: '2025-07-20T10:00:00.000Z',
    updated: '2025-08-14T09:30:00.000Z',
    organizer: { email: 'project.manager@example.com' },
    start: { dateTime: '2025-08-25T10:00:00-07:00' },
    end: { dateTime: '2025-08-25T11:30:00-07:00' },
  },

  async onEnable(context) {
    const { calendar_id, specific_event, event_id } = context.propsValue;
    const watchKey = buildWatchKey({ propsValue: context.propsValue });
    if (specific_event) {
      const pinnedEventId = specificEvent.require({ eventId: event_id });
      if (!calendar_id) {
        return;
      }
      await restoreOrBaselinePinned({
        auth: context.auth,
        store: context.store,
        calendarId: calendar_id,
        eventId: pinnedEventId,
        watchKey,
        isRepublish: context.isRepublish,
      });
      return;
    }
    await eventScan.restoreOrBaseline({
      store: context.store,
      storeKey: CHECKPOINT_STORE_KEY,
      watchKey,
      isRepublish: context.isRepublish,
      triggerName: TRIGGER_NAME,
    });
  },

  async onDisable() {
    return;
  },

  async run(context) {
    const { calendar_id, specific_event, event_id, cancellation_reason } =
      context.propsValue;
    if (!calendar_id) {
      return [];
    }
    const watchKey = buildWatchKey({ propsValue: context.propsValue });
    if (specific_event) {
      const pinnedEventId = specificEvent.require({ eventId: event_id });
      const cancelled = await pollPinnedEvent({
        auth: context.auth,
        store: context.store,
        calendarId: calendar_id,
        eventId: pinnedEventId,
        watchKey,
      });
      return cancelled.filter((event) =>
        matchesReasons({ event, reasons: cancellation_reason })
      );
    }
    const listed = await eventScan.pollUpdatedEvents({
      auth: context.auth,
      store: context.store,
      storeKey: CHECKPOINT_STORE_KEY,
      watchKey,
      calendarId: calendar_id,
      query: CANCELLATION_QUERY,
      triggerName: TRIGGER_NAME,
      skippedItems: 'Cancellations',
    });
    return newCancellations({ listed }).filter((event) =>
      matchesReasons({ event, reasons: cancellation_reason })
    );
  },

  async test(context) {
    const { calendar_id, specific_event, event_id, cancellation_reason } =
      context.propsValue;
    if (!calendar_id) {
      return [];
    }
    if (specific_event) {
      if (!event_id) {
        return [];
      }
      const fetched = await fetchPinnedEvent({
        auth: context.auth,
        calendarId: calendar_id,
        eventId: event_id,
      });
      return fetched.cancelled &&
        matchesReasons({ event: fetched.event, reasons: cancellation_reason })
        ? [fetched.event]
        : [];
    }
    const listed = await eventScan.sampleUpdatedEvents({
      auth: context.auth,
      calendarId: calendar_id,
      query: CANCELLATION_QUERY,
      lookbackMs: SAMPLE_WINDOW_MS,
      triggerName: TRIGGER_NAME,
    });
    const newestFirst = [...listed].sort(
      (left, right) => right.updatedMs - left.updatedMs
    );
    return newCancellations({ listed: newestFirst })
      .filter((event) => matchesReasons({ event, reasons: cancellation_reason }))
      .slice(0, SAMPLE_SIZE);
  },
});

function newCancellations({
  listed,
}: {
  listed: ListedEvent[];
}): GoogleCalendarEvent[] {
  const cancelledSeries = new Set(
    listed
      .filter(({ event }) => event.status === 'cancelled' && !event.recurringEventId)
      .map(({ event }) => event.id)
  );
  return listed
    .filter(
      ({ event, previous }) =>
        event.status === 'cancelled' &&
        previous?.cancelled !== true &&
        !(event.recurringEventId && cancelledSeries.has(event.recurringEventId))
    )
    .map(({ event }) => event);
}

function cancellationReasonOf({
  event,
}: {
  event: CancelledEvent;
}): CancellationReason {
  const mentionsRescheduled = [event.summary, event.description].some(
    (text) =>
      typeof text === 'string' &&
      text.trim().toLowerCase().includes(RESCHEDULED_WORD)
  );
  if (mentionsRescheduled) {
    return 'rescheduled';
  }
  if (
    (event.attendees ?? []).some(
      (attendee) => attendee.responseStatus === 'declined'
    )
  ) {
    return 'declined';
  }
  if (event.organizer?.self === true || !event.summary) {
    return 'deleted';
  }
  return 'other';
}

function matchesReasons({
  event,
  reasons,
}: {
  event: CancelledEvent;
  reasons: string[] | undefined;
}): boolean {
  if (isNil(reasons) || reasons.length === 0) {
    return true;
  }
  return reasons.includes(cancellationReasonOf({ event }));
}

async function pollPinnedEvent({
  auth,
  store,
  calendarId,
  eventId,
  watchKey,
}: {
  auth: AppConnectionValueForAuthProperty<typeof googleCalendarAuth>;
  store: Store;
  calendarId: string;
  eventId: string;
  watchKey: string;
}): Promise<CancelledEvent[]> {
  const fetched = await fetchPinnedEvent({ auth, calendarId, eventId });
  const wasCancelled = await previouslyCancelled({
    store,
    watchKey,
    fetched,
  });
  await store.put<PinnedState>(PINNED_STORE_KEY, {
    watchKey,
    cancelled: fetched.cancelled,
  });
  if (isNil(wasCancelled) || wasCancelled || !fetched.cancelled) {
    return [];
  }
  return [fetched.event];
}

async function previouslyCancelled({
  store,
  watchKey,
  fetched,
}: {
  store: Store;
  watchKey: string;
  fetched: PinnedFetch;
}): Promise<boolean | null> {
  const saved = await store.get<PinnedState>(PINNED_STORE_KEY);
  if (!isNil(saved)) {
    return saved.watchKey === watchKey ? saved.cancelled : null;
  }
  const legacyLastPoll = await eventScan.readLegacyLastPoll({ store });
  if (isNil(legacyLastPoll)) {
    return null;
  }
  if (!fetched.cancelled) {
    return false;
  }
  const updatedMs = Date.parse(fetched.event.updated ?? '');
  return Number.isNaN(updatedMs) || updatedMs <= legacyLastPoll;
}

async function restoreOrBaselinePinned({
  auth,
  store,
  calendarId,
  eventId,
  watchKey,
  isRepublish,
}: {
  auth: AppConnectionValueForAuthProperty<typeof googleCalendarAuth>;
  store: Store;
  calendarId: string;
  eventId: string;
  watchKey: string;
  isRepublish: boolean | undefined;
}): Promise<void> {
  if (isRepublish) {
    const saved = await store.get<PinnedState>(PINNED_STORE_KEY);
    if (!isNil(saved) && saved.watchKey === watchKey) {
      return;
    }
    if (isNil(saved) && !isNil(await eventScan.readLegacyLastPoll({ store }))) {
      return;
    }
  }
  const fetched = await tryCatch(() =>
    fetchPinnedEvent({ auth, calendarId, eventId })
  );
  if (fetched.error) {
    const status = eventScan.httpStatusOf(fetched.error);
    console.warn(
      `[google-calendar] ${TRIGGER_NAME}: could not read event ${eventId} while enabling${
        isNil(status) ? '' : ` (HTTP ${status})`
      }; its status is recorded at the next check.`
    );
    await store.delete(PINNED_STORE_KEY);
    return;
  }
  await store.put<PinnedState>(PINNED_STORE_KEY, {
    watchKey,
    cancelled: fetched.data.cancelled,
  });
}

async function fetchPinnedEvent({
  auth,
  calendarId,
  eventId,
}: {
  auth: AppConnectionValueForAuthProperty<typeof googleCalendarAuth>;
  calendarId: string;
  eventId: string;
}): Promise<PinnedFetch> {
  const response = await tryCatch(async () =>
    httpClient.sendRequest<CancelledEvent>({
      method: HttpMethod.GET,
      url: `${googleCalendarCommon.baseUrl}/calendars/${encodeURIComponent(
        calendarId
      )}/events/${encodeURIComponent(eventId)}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: await getAccessToken(auth),
      },
      timeout: eventScan.requestTimeoutMs,
    })
  );
  if (response.error) {
    const status = eventScan.httpStatusOf(response.error);
    if (status === 404 || status === 410) {
      return { cancelled: true, event: { id: eventId, status: 'cancelled' } };
    }
    throw response.error;
  }
  const event = response.data.body;
  return { cancelled: event.status === 'cancelled', event };
}

function buildWatchKey({
  propsValue,
}: {
  propsValue: {
    calendar_id?: string;
    specific_event?: boolean;
    event_id?: string;
  };
}): string {
  return JSON.stringify([
    propsValue.calendar_id ?? '',
    propsValue.specific_event === true,
    propsValue.specific_event === true ? propsValue.event_id ?? '' : '',
  ]);
}

type CancellationReason = 'rescheduled' | 'declined' | 'deleted' | 'other';

type CancelledEvent = {
  id: string;
  status?: string;
  updated?: string;
  summary?: string;
  description?: string;
  organizer?: { self?: boolean };
  attendees?: { responseStatus?: string }[];
};

type PinnedFetch = {
  cancelled: boolean;
  event: CancelledEvent;
};

type PinnedState = {
  watchKey: string;
  cancelled: boolean;
};

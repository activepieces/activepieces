import {
  createTrigger,
  Property,
  Store,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { klaviyoAuth, KlaviyoAuthValue } from '../common/auth';
import {
  equalsFilter,
  isRecord,
  joinFilters,
  klaviyoApi,
  KlaviyoPage,
  KlaviyoResource,
  textOf,
} from '../common/client';
import { metricOptions } from '../common/props';
import { klaviyoInputs } from '../common/ai-props';
import { klaviyoOutputSchemas } from '../common/output-schemas';

export const newEventTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'new_event',
  classification: 'READ',
  displayName: 'New Event',
  description: 'Triggers when Klaviyo records a new event for the chosen metric (for example Placed Order or Opened Email). Events whose time is more than 10 minutes before Klaviyo receives them are not caught.',
  aiMetadata: {
    description: 'Fires once per new Klaviyo event of the chosen metric, optionally only for one profile, by polling events by their event time with a 10-minute look-back and de-duplicating by event ID. Events back-dated by more than 10 minutes when they reach Klaviyo are not caught.',
  },
  props: {
    metric_id: Property.Dropdown({
      displayName: 'Metric',
      description: 'The event type to watch.',
      required: true,
      auth: klaviyoAuth,
      refreshers: ['auth'],
      options: async ({ auth }) => metricOptions({ auth }),
    }),
    profile_id: Property.ShortText({
      displayName: 'Profile ID',
      description: 'Optional. Only fire for events of this profile.',
      required: false,
    }),
  },
  outputSchema: klaviyoOutputSchemas.event,
  sampleData: {
    id: '5h7mTAsqb9S',
    uuid: 'd3e1b6a0-5c3f-11f0-8000-a2b3c4d5e6f7',
    datetime: '2026-11-11T09:30:00+00:00',
    timestamp: 1794389400,
    metric_id: 'UjCMsR',
    profile_id: '01JZTTZ2NNC8ZCP45SM4J84RG2',
    event_properties: {
      OrderId: '1001',
      $value: 49.9,
    },
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    if (context.isRepublish && isState(await context.store.get<NewEventState>(STORE_KEY))) {
      return;
    }
    const enabledAt = new Date().toISOString();
    await context.store.put<NewEventState>(STORE_KEY, { since: enabledAt, checkpoint: enabledAt, recentIds: [] });
  },
  async onDisable(context) {
    await context.store.delete(STORE_KEY);
  },
  async test(context) {
    const page = await klaviyoApi.listPage({
      auth: context.auth,
      path: '/events',
      query: {
        filter: eventFilter({ metricId: context.propsValue.metric_id, profileId: context.propsValue.profile_id }),
        sort: '-datetime',
        'page[size]': TEST_ITEMS,
      },
    });
    return page.items.map(klaviyoInputs.flatEvent);
  },
  async run(context) {
    return pollNewEvents({
      auth: context.auth,
      store: context.store,
      metricId: context.propsValue.metric_id,
      profileId: context.propsValue.profile_id,
      now: Date.now(),
    });
  },
});

export async function pollNewEvents({ auth, store, metricId, profileId, now }: PollParams): Promise<Record<string, unknown>[]> {
  const state = await store.get<NewEventState>(STORE_KEY);
  const pollStartedAt = new Date(now).toISOString();
  if (!isState(state)) {
    await store.put<NewEventState>(STORE_KEY, { since: pollStartedAt, checkpoint: pollStartedAt, recentIds: [] });
    return [];
  }
  const since = textOf(state.since) ?? state.checkpoint;
  const sinceMs = Date.parse(since);
  const windowStart = new Date(Date.parse(state.checkpoint) - LOOKBACK_MS).toISOString();
  const events: KlaviyoResource[] = [];
  let cursor: string | null = null;
  for (;;) {
    const page: KlaviyoPage = await klaviyoApi.listPage({
      auth,
      path: '/events',
      query: {
        filter: joinFilters([eventFilter({ metricId, profileId }), `greater-or-equal(datetime,${windowStart})`]),
        sort: 'datetime',
        'page[size]': PAGE_SIZE,
      },
      cursor,
    });
    events.push(...page.items);
    if (!page.has_more || page.items.length === 0) {
      break;
    }
    if (events.length >= MAX_EVENTS_PER_POLL) {
      throw new Error(`Klaviyo returned more than ${MAX_EVENTS_PER_POLL} events in one poll window; stopped instead of skipping some. Narrow the trigger to one profile or a less busy metric.`);
    }
    cursor = page.next_cursor;
  }
  const seen = new Set(state.recentIds);
  const fresh = events.filter((event) => event.id !== '' && !seen.has(event.id) && !isBefore({ event, sinceMs }));
  const recentIds = events.map((event) => event.id).filter((id) => id !== '').slice(-MAX_EVENTS_PER_POLL);
  await store.put<NewEventState>(STORE_KEY, { since, checkpoint: pollStartedAt, recentIds });
  return fresh.map(klaviyoInputs.flatEvent);
}

function eventFilter({ metricId, profileId }: { metricId: unknown; profileId: unknown }): string | undefined {
  const metric = klaviyoInputs.requireText({ value: metricId, label: 'Metric' });
  const profile = klaviyoInputs.optionalText(profileId);
  return joinFilters([
    equalsFilter({ field: 'metric_id', value: metric }),
    profile === undefined ? undefined : equalsFilter({ field: 'profile_id', value: profile }),
  ]);
}

function isBefore({ event, sinceMs }: { event: KlaviyoResource; sinceMs: number }): boolean {
  const eventMs = Date.parse(String(event.attributes['datetime']));
  return !Number.isNaN(eventMs) && !Number.isNaN(sinceMs) && eventMs < sinceMs;
}

function isState(value: unknown): value is NewEventState {
  return isRecord(value)
    && textOf(value['checkpoint']) !== undefined
    && !Number.isNaN(Date.parse(String(value['checkpoint'])))
    && Array.isArray(value['recentIds']);
}

const STORE_KEY = 'klaviyo_new_event_state';

const LOOKBACK_MS = 10 * 60 * 1000;

const PAGE_SIZE = 200;

const MAX_EVENTS_PER_POLL = 2000;

const TEST_ITEMS = 5;

type NewEventState = {
  since?: string;
  checkpoint: string;
  recentIds: string[];
};

type PollParams = {
  auth: KlaviyoAuthValue;
  store: Store;
  metricId: unknown;
  profileId: unknown;
  now: number;
};

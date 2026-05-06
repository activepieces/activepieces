import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailgunAuth } from '../..';
import {
  mailgunCommon,
  mailgunApiCall,
  mailgunApiCallAbsoluteUrl,
} from '../common';

const LAST_ALERT_STORE_KEY = 'mailgun_bounce_threshold_last_alert_epoch';
const EVENTS_PAGE_SIZE = 300;
const MAX_EVENT_PAGES = 10;
const MAX_THRESHOLD = EVENTS_PAGE_SIZE * MAX_EVENT_PAGES;

export const bulkBounceThresholdExceeded = createTrigger({
  auth: mailgunAuth,
  name: 'bulk_bounce_threshold_exceeded',
  displayName: 'Bulk Bounce Threshold Exceeded',
  description:
    'Fires once when the number of failed deliveries on a domain exceeds a threshold within a rolling window. Designed for abuse / bot-attack detection — does not re-fire until the count drops back below the threshold for a full window.',
  props: {
    domain: mailgunCommon.domainDropdown,
    threshold: Property.Number({
      displayName: 'Threshold',
      description: `Number of failed events within the window that will trigger the alert. Must be between 1 and ${MAX_THRESHOLD} (capped to keep each poll bounded).`,
      required: true,
      defaultValue: 20,
    }),
    window_minutes: Property.Number({
      displayName: 'Window (minutes)',
      description:
        'Rolling window in minutes over which failed events are counted.',
      required: true,
      defaultValue: 60,
    }),
    severity: Property.StaticDropdown({
      displayName: 'Severity',
      description:
        'Which failures to count. "Permanent" = hard bounces (recommended for abuse detection).',
      required: true,
      defaultValue: 'permanent',
      options: {
        options: [
          { label: 'Permanent (hard bounces)', value: 'permanent' },
          { label: 'Temporary (soft bounces)', value: 'temporary' },
          { label: 'All failures', value: 'all' },
        ],
      },
    }),
  },
  sampleData: {
    domain: 'mg.example.com',
    count: 47,
    threshold: 20,
    window_minutes: 60,
    first_event_at: '2026-04-16T10:00:12.000Z',
    last_event_at: '2026-04-16T10:58:43.000Z',
    triggered_at: '2026-04-16T11:00:00.000Z',
    sample_events: [
      {
        timestamp: 1713261523,
        recipient: 'fake-bot-1@example.org',
        severity: 'permanent',
        reason: 'bounce',
        code: 550,
        message: 'No such user',
      },
    ],
  },
  type: TriggerStrategy.POLLING,

  async onEnable(context) {
    await context.store.delete(LAST_ALERT_STORE_KEY);
  },

  async onDisable(context) {
    await context.store.delete(LAST_ALERT_STORE_KEY);
  },

  async run(context) {
    const { domain, threshold, window_minutes, severity } = context.propsValue;
    const auth = context.auth;

    assertThresholdInRange(threshold);

    const nowMs = Date.now();
    const windowMs = window_minutes * 60 * 1000;
    const beginEpoch = Math.floor((nowMs - windowMs) / 1000);

    const events = await fetchFailedEventsInWindow({
      apiKey: auth.props.api_key,
      region: auth.props.region,
      domain,
      severity,
      beginEpoch,
      stopAt: threshold,
    });

    if (events.length < threshold) {
      // Reset the armed state so the next threshold crossing is treated as a fresh incident.
      await context.store.delete(LAST_ALERT_STORE_KEY);
      return [];
    }

    const lastAlertMs = await context.store.get<number>(LAST_ALERT_STORE_KEY);
    if (lastAlertMs) {
      // Already alerted for this incident; stay silent until the count drops back below the threshold.
      return [];
    }

    await context.store.put(LAST_ALERT_STORE_KEY, nowMs);

    return [
      buildAlertPayload({
        events,
        threshold,
        windowMinutes: window_minutes,
        domain,
      }),
    ];
  },

  async test(context) {
    const { domain, threshold, window_minutes, severity } = context.propsValue;
    const auth = context.auth;

    assertThresholdInRange(threshold);

    const nowMs = Date.now();
    const windowMs = window_minutes * 60 * 1000;
    const beginEpoch = Math.floor((nowMs - windowMs) / 1000);

    const events = await fetchFailedEventsInWindow({
      apiKey: auth.props.api_key,
      region: auth.props.region,
      domain,
      severity,
      beginEpoch,
      stopAt: threshold,
    });

    return [
      buildAlertPayload({
        events,
        threshold,
        windowMinutes: window_minutes,
        domain,
      }),
    ];
  },
});

async function fetchFailedEventsInWindow({
  apiKey,
  region,
  domain,
  severity,
  beginEpoch,
  stopAt,
}: {
  apiKey: string;
  region: string;
  domain: string;
  severity: string;
  beginEpoch: number;
  stopAt: number;
}): Promise<FailedEvent[]> {
  const queryParams: Record<string, string> = {
    event: 'failed',
    begin: String(beginEpoch),
    ascending: 'yes',
    limit: String(EVENTS_PAGE_SIZE),
  };
  if (severity !== 'all') {
    queryParams.severity = severity;
  }

  const all: FailedEvent[] = [];
  let response = await mailgunApiCall<EventsResponse>({
    apiKey,
    region,
    method: HttpMethod.GET,
    path: `/v3/${domain}/events`,
    queryParams,
  });
  all.push(...(response.body.items ?? []));

  // Follow Mailgun's `paging.next` to keep counting, but stop as soon as we
  // have enough to exceed the threshold so a sustained attack doesn't hammer
  // the API, and cap total pages so we never loop indefinitely.
  let pagesFetched = 1;
  while (
    all.length < stopAt &&
    pagesFetched < MAX_EVENT_PAGES &&
    response.body.paging?.next &&
    (response.body.items?.length ?? 0) > 0
  ) {
    response = await mailgunApiCallAbsoluteUrl<EventsResponse>({
      apiKey,
      url: response.body.paging.next,
    });
    all.push(...(response.body.items ?? []));
    pagesFetched += 1;
  }

  return all;
}

function buildAlertPayload({
  events,
  threshold,
  windowMinutes,
  domain,
}: {
  events: FailedEvent[];
  threshold: number;
  windowMinutes: number;
  domain: string;
}): Record<string, unknown> {
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const sample = sorted.slice(-10).map((e) => ({
    timestamp: e.timestamp,
    recipient: e.recipient ?? null,
    severity: e.severity ?? null,
    reason: e.reason ?? null,
    code: e['delivery-status']?.code ?? null,
    message: e['delivery-status']?.message ?? null,
  }));

  return {
    domain,
    count: events.length,
    threshold,
    window_minutes: windowMinutes,
    first_event_at: first
      ? new Date(first.timestamp * 1000).toISOString()
      : null,
    last_event_at: last
      ? new Date(last.timestamp * 1000).toISOString()
      : null,
    triggered_at: new Date().toISOString(),
    sample_events: sample,
  };
}

function assertThresholdInRange(threshold: number): void {
  if (!Number.isFinite(threshold) || threshold < 1) {
    throw new Error('Threshold must be a positive integer (1 or greater).');
  }
  if (threshold > MAX_THRESHOLD) {
    throw new Error(
      `Threshold ${threshold} exceeds the maximum supported value (${MAX_THRESHOLD}). Lower the threshold or shorten the window.`,
    );
  }
}

type FailedEvent = {
  timestamp: number;
  recipient?: string;
  severity?: string;
  reason?: string;
  'delivery-status'?: { code?: number; message?: string };
};

type EventsResponse = {
  items: FailedEvent[];
  paging?: { next?: string };
};

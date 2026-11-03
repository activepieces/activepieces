import {
  createTrigger,
  Property,
  Store,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { exaAuth } from '../auth';
import { exaApi, exaInput } from '../common/client';
import { exaWebhookSignature } from '../common/webhook-signature';
import { searchMonitorRunOutputSchema } from '../output-schemas';

export const newSearchMonitorResultsTrigger = createTrigger({
  auth: exaAuth,
  name: 'new_search_monitor_results',
  classification: 'READ',
  displayName: 'New Search Monitor Results',
  description:
    'Runs a search on a schedule and triggers with the new results Exa found since the last run.',
  aiMetadata: {
    description:
      'Fires once per completed Exa search-monitor run: Exa repeats the configured query on the chosen interval, removes results it already returned, and delivers the new results with their citations; summary describes exactly those results and is null when the run also held results delivered before (run_summary, run_result_count and run_citations then describe the whole run). Numbered markers such as [1] in the summaries come from Exa and do not reliably index the citation lists. Check status and fail_reason before using the results. Each run is billed by Exa (about $0.015 per run).',
  },
  props: {
    info: Property.MarkDown({
      value: `Exa creates a **Monitor** that repeats this search on a schedule and sends only new results.

- Each run costs about **$0.015** on your Exa account (plus $0.001 per result above 10). An hourly monitor is about 720 runs a month (≈ $11); daily is about 30 (≈ $0.45).
- Exa only delivers to a public **HTTPS** address. On a self-hosted instance, the Activepieces webhook URL must be reachable from the internet.
- Testing the trigger in the builder runs one search (about $0.007, plus content charges when page text or highlights are on) and shows its results; it does not create a monitor.
- Results that were already delivered are not sent again, also after the flow is republished. A run whose results were all delivered before is skipped. When a run mixes old and new results, only the new ones are sent, with their citations; Summary is then empty, and Run Summary and Run Citations cover the whole run. Numbered markers such as [1] in Exa's summaries are Exa's own; Exa does not document what they point to, so use the citation lists for sources.
- Turning the flow off deletes the monitor, retrying if Exa is briefly unavailable. If it still can't be deleted, remove it in the Exa dashboard: it is named after this flow unless you set Monitor Name.`,
    }),
    query: Property.LongText({
      displayName: 'Search Query',
      description:
        'What to watch for, written as the ongoing signal rather than a date range. Example: "new battery recycling facilities announced in North America".',
      required: true,
    }),
    period: Property.StaticDropdown({
      displayName: 'Check Every',
      description: 'How often Exa runs the search. Each run may start up to 30 minutes late.',
      required: true,
      defaultValue: '1d',
      options: {
        options: [
          { label: 'Hour', value: '1h' },
          { label: '6 hours', value: '6h' },
          { label: 'Day', value: '1d' },
          { label: 'Week', value: '7d' },
        ],
      },
    }),
    numResults: Property.Number({
      displayName: 'Max Results per Run',
      description: 'Up to how many new results each run returns, 1 to 100. Defaults to 10; results above 10 cost extra.',
      required: false,
      defaultValue: 10,
    }),
    includeDomains: Property.Array({
      displayName: 'Include Domains',
      description: 'Only return results from these domains, e.g. "techcrunch.com". Leave empty for the whole web.',
      required: false,
    }),
    excludeDomains: Property.Array({
      displayName: 'Exclude Domains',
      description: 'Never return results from these domains.',
      required: false,
    }),
    includeText: Property.Checkbox({
      displayName: 'Include Page Text',
      description: 'Add the full page text to each result.',
      required: false,
      defaultValue: false,
    }),
    includeHighlights: Property.Checkbox({
      displayName: 'Include Highlights',
      description: 'Add the most relevant snippets from each page to each result.',
      required: false,
      defaultValue: false,
    }),
    monitorName: Property.ShortText({
      displayName: 'Monitor Name',
      description: 'Optional name shown for this monitor in the Exa dashboard.',
      required: false,
    }),
  },
  sampleData: sampleRun(),
  outputSchema: searchMonitorRunOutputSchema,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    if (!context.webhookUrl.startsWith('https://')) {
      throw new Error(
        `Exa only delivers to a public HTTPS address, and this flow's webhook URL is ${context.webhookUrl}. Make the Activepieces webhook URL reachable over HTTPS from the internet.`,
      );
    }
    const apiKey = context.auth.secret_text;
    const search = monitorSearchOf(context.propsValue);
    const name = exaInput.optionalText(context.propsValue.monitorName) ?? `Activepieces flow ${context.flows.current.id}`;

    const previous = await context.store.get<MonitorState>(STORE_KEY);

    const monitor = await exaApi.call<{ id: string; webhookSecret?: string }>({
      apiKey,
      method: HttpMethod.POST,
      path: '/monitors',
      body: {
        name,
        search,
        trigger: { type: 'interval', period: context.propsValue.period },
        webhook: {
          url: context.webhookUrl,
          events: ['monitor.run.completed'],
        },
      },
    });

    const staleBefore = staleIdsOf(previous);
    const webhookSecret = monitor.webhookSecret;
    if (!webhookSecret) {
      const cleanup = await rollBackMonitor({ apiKey, monitorId: monitor.id });
      if (!cleanup.deleted) {
        try {
          await context.store.put<MonitorState>(STORE_KEY, {
            monitorId: previous?.monitorId ?? null,
            webhookSecret: previous?.webhookSecret ?? null,
            stale: uniqueIds([...staleBefore, monitor.id]),
          });
        } catch (error) {
          throw new Error(
            `Exa created the monitor without a webhook secret, and it could not be saved for cleanup: ${messageOf(error)}. ${cleanup.message}`,
          );
        }
      }
      throw new Error(`Exa created the monitor without a webhook secret, so deliveries could not be verified. ${cleanup.message} Turn the flow on again.`);
    }
    const stale = uniqueIds([...staleBefore, ...(previous?.monitorId ? [previous.monitorId] : [])]).filter((id) => id !== monitor.id);
    try {
      await context.store.put<MonitorState>(STORE_KEY, { monitorId: monitor.id, webhookSecret, stale });
    } catch (error) {
      const cleanup = await rollBackMonitor({ apiKey, monitorId: monitor.id });
      throw new Error(`Could not save the Exa monitor ID: ${messageOf(error)}. ${cleanup.message}`);
    }
    await drainStaleMonitors({ store: context.store, apiKey, state: { monitorId: monitor.id, webhookSecret, stale } });
  },
  async onDisable(context) {
    const apiKey = context.auth.secret_text;
    const state = await context.store.get<MonitorState>(STORE_KEY);
    if (!state) {
      return;
    }
    if (state.monitorId) {
      try {
        await deleteMonitor({ apiKey, monitorId: state.monitorId });
      } catch (error) {
        throw new Error(
          `Could not delete the Exa monitor ${state.monitorId}: ${messageOf(error)}. It stays recorded and is retried the next time the flow is turned on or off; you can also delete it in the Exa dashboard.`,
        );
      }
    }
    await drainStaleMonitors({ store: context.store, apiKey, state: { monitorId: null, webhookSecret: null, stale: staleIdsOf(state) } });
  },
  async test(context) {
    const search = monitorSearchOf(context.propsValue);
    const response = await exaApi.call<{ results?: unknown[] }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/search',
      body: search,
    });
    const results = (response.results ?? []).map(resultOf);
    return [
      {
        event_id: null,
        event_created_at: null,
        run_id: null,
        monitor_id: null,
        status: 'completed',
        fail_reason: null,
        summary: null,
        run_summary: null,
        result_count: results.length,
        run_result_count: results.length,
        results,
        citations: [],
        run_citations: [],
      },
    ];
  },
  async run(context) {
    const state = await context.store.get<MonitorState>(STORE_KEY);
    const signatureHeader = exaWebhookSignature.headerOf({
      headers: context.payload.headers,
      name: exaWebhookSignature.HEADER,
    });
    const problem = exaWebhookSignature.problemOf({
      secret: state?.webhookSecret ?? undefined,
      signatureHeader,
      rawBody: context.payload.rawBody,
    });
    if (problem !== undefined || !state?.monitorId) {
      console.warn(`[exa] Dropped a search-monitor delivery because ${problem ?? 'the flow has no monitor'}.`);
      return [];
    }
    const event = eventOf(context.payload.body);
    if (!event || event.type !== 'monitor.run.completed' || event.data?.monitorId !== state.monitorId) {
      return [];
    }
    const seen = (await context.store.get<SeenState>(SEEN_KEY)) ?? { eventIds: [], urls: [] };
    const dedupeId = event.id ?? event.data?.id;
    if (dedupeId && seen.eventIds.includes(dedupeId)) {
      return [];
    }
    const run = flattenEvent(event);
    const fresh = run.results.filter((result) => result.url === null || !seen.urls.includes(result.url));
    const freshUrls = fresh.flatMap((result) => (result.url === null ? [] : [result.url]));
    const freshUrlSet = new Set(freshUrls);
    const complete = fresh.length === run.results.length;
    await context.store.put<SeenState>(SEEN_KEY, {
      eventIds: (dedupeId ? [dedupeId, ...seen.eventIds] : seen.eventIds).slice(0, SEEN_EVENT_LIMIT),
      urls: [...freshUrls, ...seen.urls].slice(0, SEEN_URL_LIMIT),
    });
    if (run.results.length > 0 && fresh.length === 0) {
      return [];
    }
    return [
      {
        ...run,
        results: fresh,
        result_count: fresh.length,
        summary: complete ? run.run_summary : null,
        citations: complete
          ? run.citations
          : run.citations.filter((citation) => citation.url !== null && freshUrlSet.has(citation.url)),
      },
    ];
  },
});

function monitorSearchOf(propsValue: {
  query: string;
  numResults?: number;
  includeDomains?: unknown[];
  excludeDomains?: unknown[];
  includeText?: boolean;
  includeHighlights?: boolean;
}): Record<string, unknown> {
  const numResults = exaInput.optionalInteger({
    value: propsValue.numResults,
    name: 'Max Results per Run',
    min: 1,
    max: 100,
  });
  const includeDomains = exaInput.stringList(propsValue.includeDomains);
  const excludeDomains = exaInput.stringList(propsValue.excludeDomains);
  const contents = {
    ...(propsValue.includeText ? { text: true } : {}),
    ...(propsValue.includeHighlights ? { highlights: true } : {}),
  };
  return {
    query: propsValue.query,
    ...(numResults !== undefined ? { numResults } : {}),
    ...(includeDomains ? { includeDomains } : {}),
    ...(excludeDomains ? { excludeDomains } : {}),
    ...(Object.keys(contents).length > 0 ? { contents } : {}),
  };
}

async function deleteMonitor({ apiKey, monitorId }: { apiKey: string; monitorId: string }): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    try {
      await exaApi.call<unknown>({
        apiKey,
        method: HttpMethod.DELETE,
        path: `/monitors/${encodeURIComponent(monitorId)}`,
      });
      return;
    } catch (error) {
      const status = exaApi.statusOf(error);
      if (status === 404) {
        return;
      }
      const retryable = status === undefined || status === 429 || status >= 500;
      if (!retryable || attempt >= DELETE_RETRY_DELAYS_MS.length) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, DELETE_RETRY_DELAYS_MS[attempt]));
    }
  }
}

async function drainStaleMonitors({ store, apiKey, state }: { store: Store; apiKey: string; state: MonitorState }): Promise<void> {
  const remaining: string[] = [];
  for (const monitorId of state.stale) {
    try {
      await deleteMonitor({ apiKey, monitorId });
    } catch {
      remaining.push(monitorId);
    }
  }
  try {
    if (state.monitorId === null && remaining.length === 0) {
      await store.delete(STORE_KEY);
    } else {
      await store.put<MonitorState>(STORE_KEY, { ...state, stale: remaining });
    }
  } catch (error) {
    console.warn(
      `[exa] Could not update the monitor cleanup list (${messageOf(error)}). Monitors still to delete: ${remaining.length > 0 ? remaining.join(', ') : 'none'}; the stored list is unchanged and is retried on the next enable or disable.`,
    );
  }
}

function staleIdsOf(state: MonitorState | null): string[] {
  return Array.isArray(state?.stale) ? state.stale.filter((id) => typeof id === 'string') : [];
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

async function rollBackMonitor({ apiKey, monitorId }: { apiKey: string; monitorId: string }): Promise<{ deleted: boolean; message: string }> {
  try {
    await deleteMonitor({ apiKey, monitorId });
    return { deleted: true, message: 'The new monitor was deleted again.' };
  } catch (error) {
    return {
      deleted: false,
      message: `The new monitor ${monitorId} could not be deleted (${messageOf(error)}); delete it in the Exa dashboard.`,
    };
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function eventOf(body: unknown): MonitorEvent | undefined {
  if (typeof body !== 'object' || body === null) {
    return undefined;
  }
  const type: unknown = Reflect.get(body, 'type');
  if (typeof type !== 'string') {
    return undefined;
  }
  const id: unknown = Reflect.get(body, 'id');
  const createdAt: unknown = Reflect.get(body, 'createdAt');
  const data: unknown = Reflect.get(body, 'data');
  return {
    id: typeof id === 'string' ? id : undefined,
    type,
    createdAt: typeof createdAt === 'string' ? createdAt : undefined,
    data: typeof data === 'object' && data !== null ? runOf(data) : undefined,
  };
}

function runOf(data: object): MonitorRun {
  const output: unknown = Reflect.get(data, 'output');
  const outputObject = typeof output === 'object' && output !== null ? output : undefined;
  const results: unknown = outputObject ? Reflect.get(outputObject, 'results') : undefined;
  const grounding: unknown = outputObject ? Reflect.get(outputObject, 'grounding') : undefined;
  return {
    id: stringOf(Reflect.get(data, 'id')),
    monitorId: stringOf(Reflect.get(data, 'monitorId')),
    status: stringOf(Reflect.get(data, 'status')),
    failReason: stringOf(Reflect.get(data, 'failReason')),
    content: outputObject ? Reflect.get(outputObject, 'content') ?? null : null,
    results: Array.isArray(results) ? results : [],
    grounding: Array.isArray(grounding) ? grounding : [],
  };
}

function flattenEvent(event: MonitorEvent): FlatMonitorRun {
  const run = event.data;
  const results = (run?.results ?? []).map(resultOf);
  const content = run?.content ?? null;
  const citations = citationsOf(run?.grounding ?? []);
  return {
    event_id: event.id ?? null,
    event_created_at: event.createdAt ?? null,
    run_id: run?.id ?? null,
    monitor_id: run?.monitorId ?? null,
    status: run?.status ?? null,
    fail_reason: run?.failReason ?? null,
    summary: typeof content === 'string' ? content : null,
    run_summary: typeof content === 'string' ? content : null,
    result_count: results.length,
    run_result_count: results.length,
    results,
    citations,
    run_citations: citations,
  };
}

function resultOf(item: unknown): FlatMonitorResult {
  const get = (key: string): unknown =>
    typeof item === 'object' && item !== null ? Reflect.get(item, key) : undefined;
  const highlights = get('highlights');
  return {
    id: stringOf(get('id')),
    title: stringOf(get('title')),
    url: stringOf(get('url')),
    published_date: isoDateOf(get('publishedDate')),
    author: stringOf(get('author')),
    text: stringOf(get('text')),
    highlights: Array.isArray(highlights) ? highlights.map(String).join('\n') : null,
    summary: stringOf(get('summary')),
    image: stringOf(get('image')),
  };
}

function citationsOf(grounding: unknown[]): MonitorCitation[] {
  return grounding.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null) {
      return [];
    }
    const citations: unknown = Reflect.get(entry, 'citations');
    if (!Array.isArray(citations)) {
      return [];
    }
    return citations.map((citation: unknown) => ({
      field: stringOf(Reflect.get(entry, 'field')),
      url: typeof citation === 'object' && citation !== null ? stringOf(Reflect.get(citation, 'url')) : null,
      title: typeof citation === 'object' && citation !== null ? stringOf(Reflect.get(citation, 'title')) : null,
      confidence: stringOf(Reflect.get(entry, 'confidence')),
    }));
  });
}

function isoDateOf(value: unknown): string | null {
  const text = stringOf(value);
  if (text === null) {
    return null;
  }
  const match = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d+)?Z?$/.exec(text);
  if (!match) {
    return text;
  }
  const millis = (match[3] ?? '.000').slice(1, 4).padEnd(3, '0');
  return `${match[1]}T${match[2]}.${millis}Z`;
}

function stringOf(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function sampleRun(): Record<string, unknown> {
  return {
    event_id: 'event_01k4d9x2m5n8p1q4r7s0t3v6w9',
    event_created_at: '2026-09-05T20:00:00.000Z',
    run_id: '01k4d9w8a1b2c3d4e5f6g7h8j9',
    monitor_id: '01k4d9w6y3h7p2m8n5q1r0s4tv',
    status: 'completed',
    fail_reason: null,
    summary: 'Two new battery recycling facilities were announced in Ontario and Nevada this week. [1]',
    run_summary: 'Two new battery recycling facilities were announced in Ontario and Nevada this week. [1]',
    result_count: 1,
    run_result_count: 1,
    results: [
      {
        id: 'https://example.com/announcement',
        title: 'New battery recycling facility announced',
        url: 'https://example.com/announcement',
        published_date: '2026-09-04T00:00:00.000Z',
        author: null,
        text: null,
        highlights: null,
        summary: null,
        image: 'https://example.com/announcement/cover.webp',
      },
    ],
    citations: [
      {
        field: 'content',
        url: 'https://example.com/announcement',
        title: 'New battery recycling facility announced',
        confidence: 'high',
      },
    ],
    run_citations: [
      {
        field: 'content',
        url: 'https://example.com/announcement',
        title: 'New battery recycling facility announced',
        confidence: 'high',
      },
    ],
  };
}

const STORE_KEY = 'exa_search_monitor';
const SEEN_EVENT_LIMIT = 50;
const SEEN_KEY = 'exa_search_monitor_seen';
const SEEN_URL_LIMIT = 500;
const DELETE_RETRY_DELAYS_MS = [500, 1500];

type SeenState = {
  eventIds: string[];
  urls: string[];
};

type MonitorState = {
  monitorId: string | null;
  webhookSecret: string | null;
  stale: string[];
};

type MonitorRun = {
  id: string | null;
  monitorId: string | null;
  status: string | null;
  failReason: string | null;
  content: unknown;
  results: unknown[];
  grounding: unknown[];
};

type MonitorEvent = {
  id: string | undefined;
  type: string;
  createdAt: string | undefined;
  data: MonitorRun | undefined;
};

type FlatMonitorResult = {
  id: string | null;
  title: string | null;
  url: string | null;
  published_date: string | null;
  author: string | null;
  text: string | null;
  highlights: string | null;
  summary: string | null;
  image: string | null;
};

type FlatMonitorRun = {
  event_id: string | null;
  event_created_at: string | null;
  run_id: string | null;
  monitor_id: string | null;
  status: string | null;
  fail_reason: string | null;
  summary: string | null;
  run_summary: string | null;
  result_count: number;
  run_result_count: number;
  results: FlatMonitorResult[];
  citations: MonitorCitation[];
  run_citations: MonitorCitation[];
};

type MonitorCitation = {
  field: string | null;
  url: string | null;
  title: string | null;
  confidence: string | null;
};

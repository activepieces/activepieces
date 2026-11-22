import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vapiAuth } from '../auth';
import { vapiApi, vapiUtils } from '../common/vapi-api';
import { vapiOutputSchemas } from '../common/output-schemas';

const STATE_KEY = 'vapi_call_ended_state';
const LOOKBACK_MS = 10 * 60 * 1000;
const PAGE_SIZE = 1000;
const MAX_REQUESTS = 20;

function endedAtMs(call: Record<string, unknown>): number | null {
  if (call['status'] !== 'ended' || typeof call['endedAt'] !== 'string') {
    return null;
  }
  const parsed = Date.parse(call['endedAt']);
  return Number.isNaN(parsed) ? null : parsed;
}

function selectNewCalls({
  calls,
  state,
  pollStartedAt,
}: {
  calls: Record<string, unknown>[];
  state: CallEndedState;
  pollStartedAt: number;
}): { emit: Record<string, unknown>[]; nextState: CallEndedState } {
  const windowStart = state.lastPollAt - LOOKBACK_MS;
  const floor = Math.max(windowStart, state.enabledAt);
  const emitted = new Map<string, number>();
  for (const entry of state.emitted) {
    if (entry.endedAt >= windowStart) {
      emitted.set(entry.id, entry.endedAt);
    }
  }
  const fresh: { call: Record<string, unknown>; endedAt: number; id: string }[] = [];
  for (const call of calls) {
    const id = call['id'];
    const endedAt = endedAtMs(call);
    if (typeof id !== 'string' || endedAt === null || endedAt < floor || emitted.has(id)) {
      continue;
    }
    emitted.set(id, endedAt);
    fresh.push({ call, endedAt, id });
  }
  fresh.sort((a, b) => a.endedAt - b.endedAt);
  const nextWindowStart = pollStartedAt - LOOKBACK_MS;
  const nextEmitted = [...emitted.entries()]
    .filter(([, endedAt]) => endedAt >= nextWindowStart)
    .map(([id, endedAt]) => ({ id, endedAt }));
  return {
    emit: fresh.map((item) => item.call),
    nextState: { enabledAt: state.enabledAt, lastPollAt: pollStartedAt, emitted: nextEmitted },
  };
}

async function fetchWindow({ apiKey, from, to }: { apiKey: string; from: number; to: number }): Promise<Record<string, unknown>[]> {
  const response = await vapiApi.request<unknown>({
    apiKey,
    method: HttpMethod.GET,
    path: '/call',
    operation: 'list calls',
    query: {
      updatedAtGe: new Date(from).toISOString(),
      updatedAtLe: new Date(to).toISOString(),
      limit: PAGE_SIZE,
    },
  });
  return vapiUtils.asArray(response);
}

async function fetchCallsUpdatedSince({
  apiKey,
  since,
  until,
}: {
  apiKey: string;
  since: number;
  until: number;
}): Promise<Record<string, unknown>[]> {
  const byId = new Map<string, Record<string, unknown>>();
  const pending: { from: number; to: number }[] = [{ from: since, to: until }];
  let requests = 0;
  while (pending.length > 0) {
    const window = pending.pop();
    if (!window) {
      break;
    }
    if (requests >= MAX_REQUESTS) {
      throw new Error(
        `Too many Vapi calls changed since the last check (over ${MAX_REQUESTS} pages); the trigger stopped so no ended call is skipped.`
      );
    }
    requests++;
    const calls = await fetchWindow({ apiKey, from: window.from, to: window.to });
    if (calls.length >= PAGE_SIZE) {
      if (window.to - window.from < 2) {
        throw new Error(
          `More than ${PAGE_SIZE} Vapi calls changed within one millisecond; the trigger stopped so no ended call is skipped.`
        );
      }
      const middle = Math.floor((window.from + window.to) / 2);
      pending.push({ from: window.from, to: middle }, { from: middle + 1, to: window.to });
      continue;
    }
    for (const call of calls) {
      const id = call['id'];
      if (typeof id === 'string' && !byId.has(id)) {
        byId.set(id, vapiUtils.cleanCall(call));
      }
    }
  }
  return [...byId.values()];
}

function readState(value: unknown): CallEndedState | null {
  if (!vapiUtils.isRecord(value)) {
    return null;
  }
  const enabledAt = value['enabledAt'];
  const lastPollAt = value['lastPollAt'];
  const emitted = value['emitted'];
  if (typeof enabledAt !== 'number' || typeof lastPollAt !== 'number' || !Array.isArray(emitted)) {
    return null;
  }
  return {
    enabledAt,
    lastPollAt,
    emitted: emitted.flatMap((entry) =>
      vapiUtils.isRecord(entry) && typeof entry['id'] === 'string' && typeof entry['endedAt'] === 'number'
        ? [{ id: entry['id'], endedAt: entry['endedAt'] }]
        : []
    ),
  };
}

export const callEnded = createTrigger({
  auth: vapiAuth,
  name: 'call_ended',
  displayName: 'Call Ended',
  description: 'Triggers when a Vapi call ends, with its transcript, summary, recording and cost.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once for each Vapi call that reaches status "ended" after the trigger is turned on, with the full call record (ended reason, customer, transcript, summary, recording URL, cost). Polls Vapi; calls are de-duplicated by ID.',
  },
  type: TriggerStrategy.POLLING,
  props: {},
  outputSchema: vapiOutputSchemas.call,
  sampleData: {
    id: '0c1a6b5e-1234-4c3f-9b7a-2f1e0d9c8b7a',
    type: 'outboundPhoneCall',
    status: 'ended',
    endedReason: 'customer-ended-call',
    assistantId: '5b2c7d9e-8f1a-4b3c-a2d1-0e9f8c7b6a5d',
    phoneNumberId: '9a8b7c6d-5e4f-4a3b-b2c1-d0e9f8a7b6c5',
    customer: { number: '+14155551234', name: 'Jane Doe' },
    startedAt: '2026-11-17T10:00:05.000Z',
    endedAt: '2026-11-17T10:01:02.000Z',
    cost: 0.0912,
    artifact: {
      transcript: 'AI: Hi, this is Riley from Acme.\nUser: Hi, I was calling about my order.',
      recordingUrl: 'https://storage.vapi.ai/0c1a6b5e-recording.wav',
    },
    analysis: { summary: 'The customer asked about the status of an order.', successEvaluation: 'true' },
    orgId: '1f2e3d4c-5b6a-4978-8a9b-0c1d2e3f4a5b',
    createdAt: '2026-11-17T10:00:00.000Z',
    updatedAt: '2026-11-17T10:01:10.000Z',
  },
  async onEnable(context) {
    const existing = readState(await context.store.get(STATE_KEY));
    if (existing !== null) {
      return;
    }
    const now = Date.now();
    const state: CallEndedState = { enabledAt: now, lastPollAt: now, emitted: [] };
    await context.store.put(STATE_KEY, state);
  },
  async onDisable(context) {
    await context.store.delete(STATE_KEY);
  },
  async test(context) {
    const response = await vapiApi.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/call',
      operation: 'list calls',
      query: { limit: 50 },
    });
    return vapiUtils
      .asArray(response)
      .filter((call) => endedAtMs(call) !== null)
      .slice(0, 5)
      .map((call) => vapiUtils.cleanCall(call));
  },
  async run(context) {
    const pollStartedAt = Date.now();
    const state = readState(await context.store.get(STATE_KEY)) ?? {
      enabledAt: pollStartedAt,
      lastPollAt: pollStartedAt,
      emitted: [],
    };
    const calls = await fetchCallsUpdatedSince({
      apiKey: context.auth.secret_text,
      since: state.lastPollAt - LOOKBACK_MS,
      until: pollStartedAt,
    });
    const { emit, nextState } = selectNewCalls({ calls, state, pollStartedAt });
    await context.store.put(STATE_KEY, nextState);
    return emit;
  },
});

export const callEndedInternals = { selectNewCalls, fetchCallsUpdatedSince, readState, LOOKBACK_MS };

export type CallEndedState = {
  enabledAt: number;
  lastPollAt: number;
  emitted: { id: string; endedAt: number }[];
};

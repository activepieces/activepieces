import {
  HttpMethod,
  HttpMessageBody,
  httpClient,
} from '@activepieces/pieces-common';

const BASE_URL = 'https://api.agentline.cloud';

export async function agentlineApiCall<T extends HttpMessageBody>(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: Record<string, unknown>,
  queryParams?: Record<string, string>,
) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  return await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    headers,
    body,
    queryParams,
  });
}

// ── Shared event types ──────────────────────────────────────────────

export interface AgentlineEvent {
  event_id: string;
  agent_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface EventPeekResponse {
  pending_count: number;
  events: AgentlineEvent[];
}

export interface EventConsumeResponse {
  events: AgentlineEvent[];
  count: number;
}

export interface LastEventState {
  lastEventId: string | null;
}

// ── Shared polling helpers for triggers ─────────────────────────────

/**
 * Shared onEnable: peek at current events to set the baseline cursor.
 * Uses the non-destructive /peek endpoint.
 */
export async function triggerOnEnable(
  auth: string,
  storeKey: string,
  eventType: string,
  store: { put: <T>(key: string, value: T) => Promise<T> },
) {
  const response = await agentlineApiCall<EventPeekResponse>(
    auth,
    HttpMethod.GET,
    '/v1/events/peek',
    undefined,
    { event_type: eventType },
  );
  const events = response.body.events ?? [];
  await store.put<LastEventState>(storeKey, {
    lastEventId:
      events.length > 0 ? events[events.length - 1].event_id : null,
  });
}

/**
 * Shared onDisable: clear the cursor from the store.
 */
export async function triggerOnDisable(
  storeKey: string,
  store: { put: <T>(key: string, value: T) => Promise<T> },
) {
  await store.put(storeKey, null);
}

/**
 * Shared run: consume events from the mailbox and apply cursor logic.
 *
 * BUG FIX (Greptile P1): When the stored lastEventId is NOT found in
 * the consumed batch, we now return an empty array instead of the full
 * batch. This prevents pre-activation events from firing as new triggers
 * when the cursor has scrolled past or events were consumed externally.
 */
export async function triggerRun(
  auth: string,
  storeKey: string,
  eventType: string,
  store: {
    get: <T>(key: string) => Promise<T | null>;
    put: <T>(key: string, value: T) => Promise<T>;
  },
): Promise<AgentlineEvent[]> {
  const lastState = await store.get<LastEventState>(storeKey);

  const response = await agentlineApiCall<EventConsumeResponse>(
    auth,
    HttpMethod.GET,
    '/v1/events',
    undefined,
    { event_type: eventType },
  );

  const events = response.body.events ?? [];
  if (events.length === 0) {
    return [];
  }

  let newEvents: AgentlineEvent[];

  if (lastState?.lastEventId) {
    const lastIndex = events.findIndex(
      (e) => e.event_id === lastState.lastEventId,
    );
    if (lastIndex >= 0) {
      // Cursor found — return only events after it
      newEvents = events.slice(lastIndex + 1);
    } else {
      // Cursor NOT found in batch — the cursor has scrolled past or
      // events were consumed externally. Skip the entire batch to
      // avoid firing pre-activation events.
      newEvents = [];
    }
  } else {
    // No cursor set (first run after enable with no prior events) —
    // all events in this batch are new
    newEvents = events;
  }

  // Update the cursor to the latest event
  await store.put<LastEventState>(storeKey, {
    lastEventId: events[events.length - 1].event_id,
  });

  return newEvents;
}

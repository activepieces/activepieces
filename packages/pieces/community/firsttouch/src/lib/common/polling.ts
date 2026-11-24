import { Store } from '@activepieces/pieces-framework';

async function enable({
  store,
  isRepublish,
  fetchEvents,
}: {
  store: Store;
  isRepublish: boolean | undefined;
  fetchEvents: () => Promise<PolledEvent[]>;
}): Promise<void> {
  if (isRepublish && (await store.get<string[]>(SEEN_KEY)) !== null) {
    return;
  }
  const events = await fetchEvents();
  await store.put(SEEN_KEY, events.map((event) => event.id).slice(0, MAX_SEEN));
}

async function disable({ store }: { store: Store }): Promise<void> {
  await store.delete(SEEN_KEY);
}

async function poll({
  store,
  fetchEvents,
}: {
  store: Store;
  fetchEvents: () => Promise<PolledEvent[]>;
}): Promise<Record<string, unknown>[]> {
  const previous = await store.get<string[]>(SEEN_KEY);
  const events = await fetchEvents();
  const seen = new Set(previous ?? []);
  const merged = [...events.map((event) => event.id), ...(previous ?? [])];
  await store.put(
    SEEN_KEY,
    merged.filter((id, index) => merged.indexOf(id) === index).slice(0, MAX_SEEN),
  );
  if (previous === null) {
    return [];
  }
  return events
    .filter((event) => !seen.has(event.id))
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
    .map((event) => event.data);
}

async function test({ fetchEvents }: { fetchEvents: () => Promise<PolledEvent[]> }): Promise<Record<string, unknown>[]> {
  const events = await fetchEvents();
  return [...events]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 5)
    .map((event) => event.data);
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

const SEEN_KEY = 'firsttouch_seen_event_ids';
const MAX_SEEN = 2000;

export const firstTouchPolling = { enable, disable, poll, test, daysAgoIso };

export type PolledEvent = {
  id: string;
  occurredAt: string;
  data: Record<string, unknown>;
};

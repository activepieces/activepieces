import { isNil, Store, tryCatch } from '@activepieces/pieces-framework';
import { gmail_v1 } from '@googleapis/gmail';

async function enable({
  store,
  isRepublish,
}: {
  store: Store;
  isRepublish: boolean | undefined;
}): Promise<void> {
  if (isRepublish && !isNil(await store.get(LAST_POLL_KEY))) {
    return;
  }
  const now = Date.now();
  await store.put(LAST_POLL_KEY, now);
  await store.put(SINCE_KEY, now);
  await store.delete(SEEN_KEY);
}

async function poll<T>({
  gmail,
  store,
  query,
  labelId,
  toItems,
}: {
  gmail: gmail_v1.Gmail;
  store: Store;
  query: string[];
  labelId: string | undefined;
  toItems: (message: gmail_v1.Schema$Message) => Promise<T[]>;
}): Promise<T[]> {
  const startedAt = Date.now();
  const lastPoll = await store.get<number>(LAST_POLL_KEY);
  if (typeof lastPoll !== 'number') {
    await store.put(LAST_POLL_KEY, startedAt);
    return [];
  }
  const storedSince = await store.get<number>(SINCE_KEY);
  const since = storedSince ?? lastPoll;
  if (isNil(storedSince)) {
    await store.put(SINCE_KEY, since);
  }
  const seen = await store.get<SeenMessage[]>(SEEN_KEY);
  const seenIds = new Set((seen ?? []).map((message) => message.id));
  const ids = await listMessageIds({
    gmail,
    query: [...query, `after:${searchFromSeconds(lastPoll)}`],
    labelId,
  });
  const pending = ids.filter((id) => !seenIds.has(id)).reverse();

  const handled: SeenMessage[] = [];
  const items: T[] = [];
  for (const id of pending) {
    if (handled.length > 0 && Date.now() - startedAt > TIME_BUDGET_MS) {
      break;
    }
    const { data, error } = await tryCatch(async () => {
      const message = await getRawMessage({ gmail, id });
      const epoch = Number(message.internalDate);
      return { epoch, items: epoch > since ? await toItems(message) : [] };
    });
    if (error) {
      if (isRateLimitError(error)) {
        break;
      }
      throw error;
    }
    handled.push({ id, epoch: data.epoch });
    items.push(...data.items);
  }

  const newLastPoll = handled.reduce(
    (max, message) => Math.max(max, message.epoch),
    lastPoll
  );
  await store.put(LAST_POLL_KEY, newLastPoll);
  await store.put(
    SEEN_KEY,
    [...(seen ?? []), ...handled].filter(
      (message) => message.epoch >= (searchFromSeconds(newLastPoll) - 1) * 1000
    )
  );
  return items;
}

async function sample<T>({
  gmail,
  query,
  labelId,
  toItems,
}: {
  gmail: gmail_v1.Gmail;
  query: string[];
  labelId: string | undefined;
  toItems: (message: gmail_v1.Schema$Message) => Promise<T[]>;
}): Promise<T[]> {
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: query.join(' '),
    labelIds: labelId ? [labelId] : undefined,
    maxResults: SAMPLE_SIZE,
  });
  const items: T[] = [];
  for (const message of response.data.messages ?? []) {
    if (message.id) {
      const raw = await getRawMessage({ gmail, id: message.id });
      items.push(...(await toItems(raw)));
    }
  }
  return items.slice(0, SAMPLE_SIZE);
}

async function listMessageIds({
  gmail,
  query,
  labelId,
}: {
  gmail: gmail_v1.Gmail;
  query: string[];
  labelId: string | undefined;
}): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;
  do {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query.join(' '),
      labelIds: labelId ? [labelId] : undefined,
      maxResults: PAGE_SIZE,
      pageToken,
    });
    ids.push(
      ...(response.data.messages ?? []).flatMap((message) =>
        message.id ? [message.id] : []
      )
    );
    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);
  return ids;
}

async function getRawMessage({
  gmail,
  id,
}: {
  gmail: gmail_v1.Gmail;
  id: string;
}): Promise<gmail_v1.Schema$Message> {
  const response = await gmail.users.messages.get({
    userId: 'me',
    id,
    format: 'raw',
  });
  return response.data;
}

function searchFromSeconds(lastPoll: number): number {
  return Math.floor((lastPoll - LATE_WINDOW_MS) / 1000);
}

function isRateLimitError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return false;
  }
  const message =
    'message' in error && typeof error.message === 'string'
      ? error.message
      : '';
  return (
    error.status === 429 ||
    (error.status === 403 && /quota|rate.?limit/i.test(message))
  );
}

export const gmailMessagePoll = { enable, poll, sample };

const LAST_POLL_KEY = 'lastPoll';
const SEEN_KEY = 'seenMessages';
const SINCE_KEY = 'since';
const LATE_WINDOW_MS = 10 * 60 * 1000;
const TIME_BUDGET_MS = 40 * 1000;
const PAGE_SIZE = 500;
const SAMPLE_SIZE = 5;

type SeenMessage = { id: string; epoch: number };

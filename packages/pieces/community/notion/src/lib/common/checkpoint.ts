import { createHash } from 'crypto';
import dayjs from 'dayjs';
import { isNil, Store } from '@activepieces/pieces-framework';

async function load({
  store,
}: {
  store: Store;
}): Promise<NotionCheckpoint | null> {
  return store.get<NotionCheckpoint>(CHECKPOINT_KEY);
}

async function save({
  store,
  checkpoint,
}: {
  store: Store;
  checkpoint: NotionCheckpoint;
}): Promise<void> {
  await store.put(CHECKPOINT_KEY, checkpoint);
}

async function enable({
  store,
  isRepublish,
  fetchLatest,
}: {
  store: Store;
  isRepublish: boolean | undefined;
  fetchLatest: () => Promise<CheckpointItem[]>;
}): Promise<void> {
  if (isRepublish) {
    const existing = await load({ store });
    if (!isNil(existing)) {
      return;
    }
    const legacy = fromLegacyLastItem(await store.get<unknown>(LEGACY_KEY));
    if (!isNil(legacy)) {
      await save({ store, checkpoint: legacy });
      await store.delete(LEGACY_KEY);
      return;
    }
  }
  await save({ store, checkpoint: initial(await fetchLatest()) });
}

function initial(items: CheckpointItem[]): NotionCheckpoint {
  if (items.length === 0) {
    return {
      since: dayjs().subtract(1, 'minute').startOf('minute').valueOf(),
      seen: {},
    };
  }
  const since = newestTime(items);
  return { since, seen: versionsAt({ items, time: since }) };
}

function advance({
  checkpoint,
  items,
}: {
  checkpoint: NotionCheckpoint;
  items: CheckpointItem[];
}): { fresh: CheckpointItem[]; checkpoint: NotionCheckpoint } {
  const fresh = items.filter(
    (item) =>
      item.time > checkpoint.since ||
      (item.time === checkpoint.since &&
        checkpoint.seen[item.id] !== item.version)
  );
  const since = Math.max(checkpoint.since, newestTime(items));
  const carried = since === checkpoint.since ? checkpoint.seen : {};
  return {
    fresh,
    checkpoint: {
      ...checkpoint,
      since,
      seen: { ...carried, ...versionsAt({ items, time: since }) },
    },
  };
}

function fingerprint(parts: string[]): string {
  return createHash('sha256')
    .update(JSON.stringify(parts))
    .digest('hex')
    .slice(0, 16);
}

function versionsAt({
  items,
  time,
}: {
  items: CheckpointItem[];
  time: number;
}): Record<string, string> {
  return Object.fromEntries(
    items
      .filter((item) => item.time === time)
      .map((item) => [item.id, item.version])
  );
}

function newestTime(items: CheckpointItem[]): number {
  return items.reduce(
    (newest, item) => Math.max(newest, item.time),
    Number.NEGATIVE_INFINITY
  );
}

function fromLegacyLastItem(lastItem: unknown): NotionCheckpoint | null {
  if (typeof lastItem !== 'string') {
    return null;
  }
  const epoch = Number(lastItem.split('|')[1]);
  if (!Number.isFinite(epoch)) {
    return null;
  }
  return {
    since: dayjs(epoch).add(1, 'minute').startOf('minute').valueOf(),
    seen: {},
  };
}

const CHECKPOINT_KEY = 'notion_checkpoint';
const LEGACY_KEY = 'lastItem';

export const notionCheckpoint = {
  load,
  save,
  enable,
  advance,
  fingerprint,
};

export type NotionCheckpoint = {
  since: number;
  seen: Record<string, string>;
  resume?: { cursor: string; bound: number };
};

export type CheckpointItem = {
  id: string;
  version: string;
  time: number;
  data: unknown;
};

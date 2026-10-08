import { Store } from '@activepieces/pieces-framework';
import { TeableRecord } from './client';

async function findAnchorIndex({
  rowCount,
  fetchPage,
  epochOf,
  anchorEpoch,
}: FindAnchorIndexParams): Promise<number> {
  let low = 0;
  let high = rowCount;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const page = await fetchPage({ skip: middle, take: 1 });
    const record = page[0];
    if (record === undefined || epochOf(record) >= anchorEpoch) {
      high = middle;
    } else {
      low = middle + 1;
    }
  }
  return low;
}

async function findResumeStart({
  rowCount,
  fetchPage,
  epochOf,
  resumeFrom,
}: FindResumeStartParams): Promise<number> {
  const groupStart = await findAnchorIndex({
    rowCount,
    fetchPage,
    epochOf,
    anchorEpoch: resumeFrom.epoch,
  });
  let low = groupStart;
  let high = groupStart + resumeFrom.ids.size;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const page = await fetchPage({ skip: middle, take: 1 });
    const record = page[0];
    const beyondEmittedPrefix =
      record === undefined ||
      epochOf(record) > resumeFrom.epoch ||
      (epochOf(record) === resumeFrom.epoch && !resumeFrom.ids.has(record.id));
    if (beyondEmittedPrefix) {
      high = middle;
    } else {
      low = middle + 1;
    }
  }
  return low;
}

async function scanFreshRecords({
  rowCount,
  fetchPage,
  epochOf,
  lastFetchEpochMS,
  resumeFrom,
}: ScanFreshRecordsParams): Promise<{ records: TeableRecord[]; caughtUp: boolean }> {
  const collected = new Map<string, TeableRecord>();
  let anchorEpoch = resumeFrom !== undefined ? resumeFrom.epoch : lastFetchEpochMS;
  let seenAtAnchor = resumeFrom !== undefined ? new Set(resumeFrom.ids) : new Set<string>();
  let nextSkip: number | undefined = undefined;
  let expectedFirstId: string | undefined = undefined;
  let caughtUp = false;
  let iterations = 0;
  if (resumeFrom !== undefined) {
    const resumeStart = await findResumeStart({ rowCount, fetchPage, epochOf, resumeFrom });
    nextSkip = Math.max(0, resumeStart - 1);
  }
  while (collected.size < MAX_RECORDS_PER_POLL && iterations < MAX_SCAN_ITERATIONS) {
    iterations += 1;
    if (nextSkip === undefined) {
      const anchorIndex = await findAnchorIndex({ rowCount, fetchPage, epochOf, anchorEpoch });
      nextSkip = Math.max(0, anchorIndex - 1);
      expectedFirstId = undefined;
    }
    const page = await fetchPage({ skip: nextSkip, take: TRIGGER_PAGE_SIZE });
    if (page.length === 0) {
      caughtUp = true;
      break;
    }
    const first = page[0];
    const continuous =
      nextSkip === 0 ||
      (expectedFirstId !== undefined
        ? first.id === expectedFirstId
        : epochOf(first) < anchorEpoch || seenAtAnchor.has(first.id));
    if (!continuous) {
      nextSkip = undefined;
      continue;
    }
    for (const record of page) {
      const epoch = epochOf(record);
      if (epoch > lastFetchEpochMS && !(epoch === anchorEpoch && seenAtAnchor.has(record.id))) {
        collected.set(record.id, record);
      }
    }
    const last = page[page.length - 1];
    const lastEpoch = epochOf(last);
    const tieIds = page
      .filter((record) => epochOf(record) === lastEpoch)
      .map((record) => record.id);
    if (lastEpoch > anchorEpoch) {
      anchorEpoch = lastEpoch;
      seenAtAnchor = new Set(tieIds);
    } else if (lastEpoch === anchorEpoch) {
      for (const id of tieIds) {
        seenAtAnchor.add(id);
      }
    }
    if (page.length < TRIGGER_PAGE_SIZE) {
      caughtUp = true;
      break;
    }
    expectedFirstId = last.id;
    nextSkip += page.length - 1;
  }
  return { records: [...collected.values()], caughtUp };
}

async function resolveFrontier({
  store,
  storeKey,
  lastFetchEpochMS,
}: {
  store: Store;
  storeKey: string;
  lastFetchEpochMS: number;
}): Promise<FrontierState | undefined> {
  const stored = await store.get<FrontierState>(storeKey);
  if (stored === null || stored === undefined) {
    return undefined;
  }
  let resolved: FrontierState = stored;
  if (stored.pending !== undefined) {
    const committed = stored.pending.expectedLastPoll === lastFetchEpochMS;
    resolved = {
      epoch: stored.epoch,
      ids: committed ? [...new Set([...stored.ids, ...stored.pending.ids])] : stored.ids,
    };
  }
  if (resolved.epoch <= lastFetchEpochMS) {
    await store.delete(storeKey);
    return undefined;
  }
  if (stored.pending !== undefined) {
    await store.put(storeKey, resolved);
  }
  return resolved;
}

async function pollFreshItems({
  store,
  storeKey,
  rowCount,
  fetchPage,
  epochOf,
  lastFetchEpochMS,
}: PollFreshItemsParams): Promise<{ epochMilliSeconds: number; data: TeableRecord }[]> {
  const frontier = await resolveFrontier({ store, storeKey, lastFetchEpochMS });
  const { records, caughtUp } = await scanFreshRecords({
    rowCount,
    fetchPage,
    epochOf,
    lastFetchEpochMS,
    resumeFrom:
      frontier !== undefined ? { epoch: frontier.epoch, ids: new Set(frontier.ids) } : undefined,
  });
  if (caughtUp) {
    if (frontier !== undefined) {
      await store.delete(storeKey);
    }
    return records.map((record) => ({ epochMilliSeconds: epochOf(record), data: record }));
  }
  if (records.length === 0) {
    return [];
  }
  const boundaryEpoch = records.reduce((acc, record) => Math.max(acc, epochOf(record)), 0);
  const fullyFetched = records.filter((record) => epochOf(record) < boundaryEpoch);
  if (fullyFetched.length > 0) {
    return fullyFetched.map((record) => ({ epochMilliSeconds: epochOf(record), data: record }));
  }
  const resumeEpoch = lastFetchEpochMS + 1;
  const confirmedIds =
    frontier !== undefined && frontier.epoch === boundaryEpoch ? frontier.ids : [];
  const pendingIds = records.map((record) => record.id);
  if (resumeEpoch >= boundaryEpoch || confirmedIds.length + pendingIds.length > MAX_TRACKED_TIE_IDS) {
    if (frontier !== undefined) {
      await store.delete(storeKey);
    }
    return records.map((record) => ({ epochMilliSeconds: epochOf(record), data: record }));
  }
  await store.put(storeKey, {
    epoch: boundaryEpoch,
    ids: confirmedIds,
    pending: { expectedLastPoll: resumeEpoch, ids: pendingIds },
  });
  return records.map((record) => ({ epochMilliSeconds: resumeEpoch, data: record }));
}

export const teablePolling = {
  scanFreshRecords,
  pollFreshItems,
};

export const TRIGGER_PAGE_SIZE = 500;
export const MAX_RECORDS_PER_POLL = 5000;
export const MAX_SCAN_ITERATIONS = 40;
export const MAX_TRACKED_TIE_IDS = 25000;

type FetchPage = (params: { skip: number; take: number }) => Promise<TeableRecord[]>;

type FindAnchorIndexParams = {
  rowCount: number;
  fetchPage: FetchPage;
  epochOf: (record: TeableRecord) => number;
  anchorEpoch: number;
};

type FindResumeStartParams = {
  rowCount: number;
  fetchPage: FetchPage;
  epochOf: (record: TeableRecord) => number;
  resumeFrom: ResumeFrom;
};

type ResumeFrom = { epoch: number; ids: Set<string> };

type ScanFreshRecordsParams = {
  rowCount: number;
  fetchPage: FetchPage;
  epochOf: (record: TeableRecord) => number;
  lastFetchEpochMS: number;
  resumeFrom?: ResumeFrom;
};

type PollFreshItemsParams = {
  store: Store;
  storeKey: string;
  rowCount: number;
  fetchPage: FetchPage;
  epochOf: (record: TeableRecord) => number;
  lastFetchEpochMS: number;
};

export type FrontierState = {
  epoch: number;
  ids: string[];
  pending?: {
    expectedLastPoll: number;
    ids: string[];
  };
};

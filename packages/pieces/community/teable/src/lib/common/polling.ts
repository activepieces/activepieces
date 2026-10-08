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

async function scanFreshRecords({
  rowCount,
  fetchPage,
  epochOf,
  lastFetchEpochMS,
}: ScanFreshRecordsParams): Promise<TeableRecord[]> {
  const collected = new Map<string, TeableRecord>();
  let anchorEpoch = lastFetchEpochMS;
  let seenAtAnchor = new Set<string>();
  let nextSkip: number | undefined = undefined;
  let expectedFirstId: string | undefined = undefined;
  let caughtUp = false;
  let iterations = 0;
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
      if (
        epochOf(record) > lastFetchEpochMS &&
        !(epochOf(record) === anchorEpoch && seenAtAnchor.has(record.id))
      ) {
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
  const fresh = [...collected.values()];
  if (caughtUp) {
    return fresh;
  }
  return dropIncompleteNewest({ records: fresh, epochOf });
}

function dropIncompleteNewest({
  records,
  epochOf,
}: {
  records: TeableRecord[];
  epochOf: (record: TeableRecord) => number;
}): TeableRecord[] {
  const newestEpoch = records.reduce((acc, record) => Math.max(acc, epochOf(record)), 0);
  const fullyFetched = records.filter((record) => epochOf(record) < newestEpoch);
  return fullyFetched.length > 0 ? fullyFetched : records;
}

export const teablePolling = {
  scanFreshRecords,
  dropIncompleteNewest,
};

export const TRIGGER_PAGE_SIZE = 500;
export const MAX_RECORDS_PER_POLL = 5000;
export const MAX_SCAN_ITERATIONS = 40;

type FetchPage = (params: { skip: number; take: number }) => Promise<TeableRecord[]>;

type FindAnchorIndexParams = {
  rowCount: number;
  fetchPage: FetchPage;
  epochOf: (record: TeableRecord) => number;
  anchorEpoch: number;
};

type ScanFreshRecordsParams = {
  rowCount: number;
  fetchPage: FetchPage;
  epochOf: (record: TeableRecord) => number;
  lastFetchEpochMS: number;
};

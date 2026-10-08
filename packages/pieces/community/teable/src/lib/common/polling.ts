import { TeableRecord } from './client';

async function findFirstFreshIndex({
  rowCount,
  probe,
  isFresh,
}: FindFirstFreshIndexParams): Promise<number> {
  let low = 0;
  let high = rowCount;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const record = await probe(middle);
    if (record === undefined || isFresh(record)) {
      high = middle;
    } else {
      low = middle + 1;
    }
  }
  return low;
}

async function collectFreshRecords({
  listPage,
  startIndex,
  epochOf,
  lastFetchEpochMS,
}: CollectFreshRecordsParams): Promise<TeableRecord[]> {
  const collected = new Map<string, TeableRecord>();
  let skip = startIndex;
  let caughtUp = false;
  while (skip - startIndex < MAX_RECORDS_PER_POLL) {
    const page = await listPage({ skip, take: TRIGGER_PAGE_SIZE });
    for (const record of page) {
      if (epochOf(record) > lastFetchEpochMS) {
        collected.set(record.id, record);
      }
    }
    if (page.length < TRIGGER_PAGE_SIZE) {
      caughtUp = true;
      break;
    }
    skip += TRIGGER_PAGE_SIZE;
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
  findFirstFreshIndex,
  collectFreshRecords,
  dropIncompleteNewest,
};

export const TRIGGER_PAGE_SIZE = 500;
export const MAX_RECORDS_PER_POLL = 5000;

type FindFirstFreshIndexParams = {
  rowCount: number;
  probe: (skip: number) => Promise<TeableRecord | undefined>;
  isFresh: (record: TeableRecord) => boolean;
};

type CollectFreshRecordsParams = {
  listPage: (params: { skip: number; take: number }) => Promise<TeableRecord[]>;
  startIndex: number;
  epochOf: (record: TeableRecord) => number;
  lastFetchEpochMS: number;
};

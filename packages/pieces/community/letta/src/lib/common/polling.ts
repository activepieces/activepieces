const PAGE_SIZE = 100;
const MAX_PAGES = 10;

async function collectSince<T extends { id: string }>({
  fetchPage,
  timestampOf,
  lastFetchEpochMS,
}: {
  fetchPage: (query: { limit: number; after?: string }) => Promise<T[]>;
  timestampOf: (item: T) => number;
  lastFetchEpochMS: number;
}): Promise<T[]> {
  const collected: T[] = [];
  let after: string | undefined;
  for (let pageIndex = 0; pageIndex < MAX_PAGES; pageIndex++) {
    const items = await fetchPage(after ? { limit: PAGE_SIZE, after } : { limit: PAGE_SIZE });
    const fresh = items.filter((item) => timestampOf(item) > lastFetchEpochMS);
    collected.push(...fresh);
    const isTestRun = lastFetchEpochMS === 0;
    const reachedLastSeen = fresh.length < items.length;
    if (isTestRun || reachedLastSeen || items.length < PAGE_SIZE) {
      break;
    }
    after = items[items.length - 1].id;
  }
  return collected;
}

export const lettaPolling = { collectSince, PAGE_SIZE, MAX_PAGES };

async function mapInPool<T, R>({
  items,
  concurrency,
  map,
}: {
  items: T[];
  concurrency: number;
  map: (item: T) => Promise<R>;
}): Promise<R[]> {
  const results = new Array<R>(items.length);
  const state = { next: 0, failed: false };
  const worker = async (): Promise<void> => {
    while (!state.failed && state.next < items.length) {
      const index = state.next;
      state.next += 1;
      try {
        results[index] = await map(items[index]);
      } catch (error) {
        state.failed = true;
        throw error;
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker)
  );
  return results;
}

export const drivePool = {
  mapInPool,
};

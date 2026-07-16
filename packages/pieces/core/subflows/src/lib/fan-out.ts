export async function fanOutBatches<T>({
  records,
  batchSize,
  maxInFlight,
  dispatch,
}: FanOutParams<T>): Promise<FanOutResult> {
  const inFlight = new Set<Promise<void>>();
  let firstErrorBatchIndex: number | undefined;
  let rowsProcessed = 0;
  let batchesDispatched = 0;
  let batchIndex = 0;
  let batch: T[] = [];

  const start = (index: number, rows: T[]): void => {
    const promise = dispatch({ batchIndex: index, rows })
      .then(
        () => {
          batchesDispatched++;
        },
        () => {
          if (firstErrorBatchIndex === undefined) {
            firstErrorBatchIndex = index;
          }
        }
      )
      .finally(() => {
        inFlight.delete(promise);
      });
    inFlight.add(promise);
  };

  for await (const record of records) {
    if (firstErrorBatchIndex !== undefined) {
      break;
    }
    batch.push(record);
    rowsProcessed++;
    if (batch.length >= batchSize) {
      start(batchIndex++, batch);
      batch = [];
      if (inFlight.size >= maxInFlight) {
        await Promise.race(inFlight);
      }
    }
  }
  if (firstErrorBatchIndex === undefined && batch.length > 0) {
    start(batchIndex++, batch);
  }
  await Promise.allSettled(inFlight);

  if (firstErrorBatchIndex !== undefined) {
    throw new Error(
      JSON.stringify({
        message:
          'A batch failed to dispatch; fan-out aborted. Batches before this index were already dispatched and may still be running.',
        failedBatchIndex: firstErrorBatchIndex,
        rowsProcessed,
        batchesDispatched,
      })
    );
  }
  return { rowsProcessed, batchesDispatched };
}

export type FanOutParams<T> = {
  records: AsyncIterable<T>;
  batchSize: number;
  maxInFlight: number;
  dispatch: (params: { batchIndex: number; rows: T[] }) => Promise<void>;
};

export type FanOutResult = {
  rowsProcessed: number;
  batchesDispatched: number;
};

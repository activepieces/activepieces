export async function fanOutBatches<T>({
  records,
  batchSize,
  maxInFlight,
  dispatch,
}: FanOutParams<T>): Promise<FanOutResult> {
  const inFlight = new Set<Promise<void>>();
  let firstError: { batchIndex: number; error: unknown } | undefined;
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
        (error: unknown) => {
          if (firstError === undefined) {
            firstError = { batchIndex: index, error };
          }
        }
      )
      .finally(() => {
        inFlight.delete(promise);
      });
    inFlight.add(promise);
  };

  let readError: { error: unknown } | undefined;
  try {
    for await (const record of records) {
      if (firstError !== undefined) {
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
    if (firstError === undefined && batch.length > 0) {
      start(batchIndex++, batch);
      batch = [];
    }
  } catch (error) {
    readError = { error };
  }
  await Promise.allSettled(inFlight);

  if (firstError !== undefined) {
    throw new Error(
      JSON.stringify({
        message:
          'A batch failed to dispatch; fan-out aborted. Batches before this index were already dispatched and may still be running.',
        failedBatchIndex: firstError.batchIndex,
        cause: describe(firstError.error),
        rowsProcessed: rowsProcessed - batch.length,
        batchesDispatched,
      })
    );
  }
  if (readError !== undefined) {
    throw new Error(
      JSON.stringify({
        message:
          'Failed to read the records; fan-out aborted. Batches dispatched before this point may still be running.',
        cause: describe(readError.error),
        rowsProcessed: rowsProcessed - batch.length,
        batchesDispatched,
      })
    );
  }
  return { rowsProcessed, batchesDispatched };
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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

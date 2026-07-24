/// <reference types="vitest/globals" />

import { fanOutBatches } from '../src/lib/fan-out';

async function* gen<T>(items: T[]): AsyncGenerator<T> {
  for (const item of items) {
    yield item;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('fanOutBatches', () => {
  test('groups records into batches of batchSize, last batch is the remainder', async () => {
    const seen: { batchIndex: number; rows: number[] }[] = [];
    const result = await fanOutBatches<number>({
      records: gen([1, 2, 3, 4, 5]),
      batchSize: 2,
      maxInFlight: 5,
      dispatch: async ({ batchIndex, rows }) => {
        seen.push({ batchIndex, rows });
      },
    });

    expect(result).toEqual({ rowsProcessed: 5, batchesDispatched: 3 });
    seen.sort((a, b) => a.batchIndex - b.batchIndex);
    expect(seen.map((s) => s.rows)).toEqual([[1, 2], [3, 4], [5]]);
  });

  test('never runs more than maxInFlight dispatches concurrently', async () => {
    let concurrent = 0;
    let maxConcurrent = 0;
    const result = await fanOutBatches<number>({
      records: gen([...Array(12).keys()]),
      batchSize: 1,
      maxInFlight: 3,
      dispatch: async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await sleep(5);
        concurrent--;
      },
    });

    expect(result.batchesDispatched).toBe(12);
    expect(maxConcurrent).toBeLessThanOrEqual(3);
  });

  test('aborts and throws with the failed batch index when a dispatch fails', async () => {
    let error: Error | undefined;
    try {
      await fanOutBatches<number>({
        records: gen([0, 1, 2, 3, 4]),
        batchSize: 1,
        maxInFlight: 5,
        dispatch: async ({ batchIndex }) => {
          if (batchIndex === 1) {
            throw new Error('boom');
          }
        },
      });
    } catch (e) {
      error = e as Error;
    }

    expect(error).toBeDefined();
    const payload = JSON.parse(error!.message);
    expect(payload.failedBatchIndex).toBe(1);
    expect(payload.batchesDispatched).toBeLessThan(5);
  });

  test('rowsProcessed excludes the undispatched partial batch when the failure aborts the stream mid-way', async () => {
    let error: Error | undefined;
    try {
      await fanOutBatches<number>({
        records: gen([0, 1, 2, 3, 4]),
        batchSize: 3,
        maxInFlight: 1,
        dispatch: async ({ batchIndex }) => {
          if (batchIndex === 0) {
            throw new Error('boom');
          }
        },
      });
    } catch (e) {
      error = e as Error;
    }

    const payload = JSON.parse(error!.message);
    expect(payload.failedBatchIndex).toBe(0);
    expect(payload.rowsProcessed).toBe(3);
  });

  test('rowsProcessed counts every dispatched row when the failure is only detected at drain', async () => {
    let error: Error | undefined;
    try {
      await fanOutBatches<number>({
        records: gen([0, 1, 2, 3, 4]),
        batchSize: 3,
        maxInFlight: 5,
        dispatch: async ({ batchIndex }) => {
          if (batchIndex === 0) {
            await sleep(20);
            throw new Error('boom');
          }
        },
      });
    } catch (e) {
      error = e as Error;
    }

    const payload = JSON.parse(error!.message);
    expect(payload.failedBatchIndex).toBe(0);
    expect(payload.rowsProcessed).toBe(5);
  });
});

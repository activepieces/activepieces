import { Goodmem, MemoryResponseShape } from '@pairsystems/goodmem';

export async function waitForMemory({
  client,
  memory,
  timeoutMs,
}: {
  client: Goodmem;
  memory: MemoryResponseShape;
  timeoutMs: number;
}) {
  const deadline = performance.now() + timeoutMs;
  let current = memory;
  let indexingError: string | undefined;
  while (
    current.processingStatus !== 'COMPLETED' &&
    current.processingStatus !== 'FAILED'
  ) {
    const remaining = deadline - performance.now();
    if (remaining <= 0) {
      break;
    }
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(500, remaining))
    );
    const requestTimeout = Math.ceil(deadline - performance.now());
    if (requestTimeout <= 0) {
      break;
    }
    try {
      current = await client.memories.get(memory.memoryId, undefined, {
        timeoutMs: requestTimeout,
      });
    } catch (error) {
      indexingError = error instanceof Error ? error.message : String(error);
      break;
    }
  }
  const timedOut =
    current.processingStatus !== 'COMPLETED' &&
    current.processingStatus !== 'FAILED' &&
    performance.now() >= deadline;
  return { memory: current, timedOut, indexingError };
}

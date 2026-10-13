import { Readable } from 'node:stream';
import type { ApFile, ApStreamingFile } from '@activepieces/pieces-framework';

function toStreamingBody(file: ApStreamingFile | ApFile): {
  body: Readable;
  size: number | undefined;
} {
  if ('body' in file) {
    return { body: file.body, size: file.size };
  }
  return { body: Readable.from(file.data), size: file.data.length };
}

async function* readChunks({
  readable,
  chunkSize,
}: {
  readable: Readable;
  chunkSize: number;
}): AsyncGenerator<Buffer> {
  let pending: Buffer[] = [];
  let pendingLength = 0;
  for await (const data of readable) {
    pending.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
    pendingLength += pending[pending.length - 1].length;
    while (pendingLength >= chunkSize) {
      const combined = pending.length === 1 ? pending[0] : Buffer.concat(pending);
      yield combined.subarray(0, chunkSize);
      const rest = combined.subarray(chunkSize);
      pending = rest.length > 0 ? [rest] : [];
      pendingLength = rest.length;
    }
  }
  if (pendingLength > 0) {
    yield pending.length === 1 ? pending[0] : Buffer.concat(pending);
  }
}

export const streamUtils = { readChunks, toStreamingBody };

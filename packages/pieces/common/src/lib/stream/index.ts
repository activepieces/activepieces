import { Readable } from 'node:stream';

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
      const combined = Buffer.concat(pending);
      yield combined.subarray(0, chunkSize);
      const rest = combined.subarray(chunkSize);
      pending = rest.length > 0 ? [rest] : [];
      pendingLength = rest.length;
    }
  }
  if (pendingLength > 0) {
    yield Buffer.concat(pending);
  }
}

export const streamUtils = { readChunks };

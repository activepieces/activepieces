// Pure, framework-free driver for the SimplyPrint files.simplyprint.io
// chunked-upload protocol. Lives separately from `files.ts` so the test suite
// can exercise the state machine without pulling in pieces-common/httpClient.
//
// Protocol:
//   - File <= 100 MiB: POST `file`, get back `{ file: { id, name, size, ... } }`.
//   - File  > 100 MiB: POST `file` + `totalSize`, get back `{ continueToken }`.
//     Each subsequent POST sends `file` + `continueToken`; the server responds
//     with another `continueToken` until the cumulative bytes hit `totalSize`,
//     at which point it returns the final `{ file: {...} }`.
//
// We chunk at 95 MiB (5 MiB headroom under the 100 MiB per-part cap for
// multipart framing overhead).

// 5 MiB headroom under the server's 100 MiB per-part cap for multipart framing.
const DEFAULT_CHUNK_SIZE = 95 * 1024 * 1024;

function extractFilesApiId(body: unknown): ExtractedFile | null {
  if (!body || typeof body !== 'object') return null;
  const env = body as Record<string, unknown>;

  const file = env['file'];
  if (file && typeof file === 'object') {
    const f = file as Record<string, unknown>;
    const id = f['id'];
    if (typeof id === 'string' && id.length > 0) {
      return {
        id,
        name: typeof f['name'] === 'string' ? f['name'] : undefined,
        size: typeof f['size'] === 'number' ? f['size'] : undefined,
        expiresAt: typeof f['expires_at'] === 'string' ? f['expires_at'] : undefined,
      };
    }
  }

  for (const key of ['file_id', 'fileId', 'id'] as const) {
    const v = env[key];
    if (typeof v === 'string' && v.length > 0) return { id: v };
  }
  return null;
}

async function driveChunkedUpload({
  filename,
  data,
  sendPart,
  chunkSize = DEFAULT_CHUNK_SIZE,
}: {
  filename: string;
  data: Buffer | Uint8Array;
  sendPart: (part: UploadPart) => Promise<UploadPartResponse>;
  chunkSize?: number;
}): Promise<UploadUserFileResult> {
  const totalSize = data.length;
  if (totalSize === 0) {
    throw new Error(`Refusing to upload empty file "${filename}".`);
  }
  if (chunkSize <= 0) {
    throw new Error(`Invalid chunkSize ${chunkSize}; must be a positive number of bytes.`);
  }

  if (totalSize <= chunkSize) {
    const res = await sendPart({ kind: 'only', chunk: data, filename });
    if (res.kind !== 'final') {
      throw new Error(
        `Single-shot upload for "${filename}" (${totalSize} bytes) did not return a final file id.`,
      );
    }
    return toResult(res);
  }

  let offset = 0;
  let continueToken: string | undefined;
  let partIndex = 0;

  while (offset < totalSize) {
    const end = Math.min(offset + chunkSize, totalSize);
    const chunk = data.subarray(offset, end);
    const isFirst = offset === 0;
    const isLast = end === totalSize;

    const part: UploadPart = isFirst
      ? { kind: 'first', chunk, filename, totalSize }
      : {
          kind: 'continue',
          chunk,
          filename: `${filename}.part${partIndex}`,
          // continueToken is set after the first round.
          continueToken: continueToken!,
        };

    const res = await sendPart(part);

    if (isLast) {
      if (res.kind !== 'final') {
        throw new Error(
          `Chunked upload for "${filename}" did not return a final file id on the last chunk (${end}/${totalSize} bytes sent).`,
        );
      }
      return toResult(res);
    }

    if (res.kind !== 'continue') {
      throw new Error(
        `Chunked upload for "${filename}" returned a final file id after only ${end}/${totalSize} bytes — server misread totalSize.`,
      );
    }
    continueToken = res.continueToken;
    offset = end;
    partIndex++;
  }

  throw new Error(`Unreachable — chunked upload loop for "${filename}" exited without a final response.`);
}

// Streaming counterpart: pulls arbitrary-sized byte pieces from `source`
// (e.g. a fetch() response body) and assembles them into exactly
// `totalChunks` parts. Validates source bytes match `totalSize` exactly so
// Content-Length mismatches surface as errors instead of silent truncation.
// Peak RAM is O(chunkSize), not O(totalSize).
async function driveStreamedUpload({
  filename,
  totalSize,
  source,
  sendPart,
  chunkSize = DEFAULT_CHUNK_SIZE,
}: {
  filename: string;
  totalSize: number;
  source: AsyncIterable<Uint8Array>;
  sendPart: (part: UploadPart) => Promise<UploadPartResponse>;
  chunkSize?: number;
}): Promise<UploadUserFileResult> {
  if (totalSize <= 0) {
    throw new Error(`Refusing to upload empty stream "${filename}" (totalSize=${totalSize}).`);
  }
  if (chunkSize <= 0) {
    throw new Error(`Invalid chunkSize ${chunkSize}; must be a positive number of bytes.`);
  }

  const totalChunks = Math.ceil(totalSize / chunkSize);
  const lastChunkSize = totalSize - chunkSize * (totalChunks - 1);
  const iter = source[Symbol.asyncIterator]();

  const pending: Uint8Array[] = [];
  let pendingBytes = 0;
  let sourceDone = false;

  const pullOneInto = async (): Promise<boolean> => {
    if (sourceDone) return false;
    const next = await iter.next();
    if (next.done) {
      sourceDone = true;
      return false;
    }
    if (next.value.length > 0) {
      pending.push(next.value);
      pendingBytes += next.value.length;
    }
    return true;
  };

  const takeChunk = async (n: number): Promise<Uint8Array | null> => {
    while (pendingBytes < n && !sourceDone) {
      await pullOneInto();
    }
    if (pendingBytes < n) return null;
    const out = new Uint8Array(n);
    let offset = 0;
    while (offset < n) {
      const head = pending[0];
      const need = n - offset;
      if (head.length <= need) {
        out.set(head, offset);
        offset += head.length;
        pending.shift();
      } else {
        out.set(head.subarray(0, need), offset);
        pending[0] = head.subarray(need);
        offset += need;
      }
    }
    pendingBytes -= n;
    return out;
  };

  let partIndex = 0;
  let bytesSent = 0;
  let continueToken: string | undefined;

  try {
    while (partIndex < totalChunks) {
      const isFirst = partIndex === 0;
      const isLast = partIndex === totalChunks - 1;
      const want = isLast ? lastChunkSize : chunkSize;

      const chunk = await takeChunk(want);
      if (chunk === null) {
        throw new Error(
          `Streamed upload for "${filename}" ended at ${bytesSent + pendingBytes}/${totalSize} bytes — source delivered fewer bytes than declared totalSize.`,
        );
      }

      const part: UploadPart =
        isFirst && isLast
          ? { kind: 'only', chunk, filename }
          : isFirst
            ? { kind: 'first', chunk, filename, totalSize }
            : {
                kind: 'continue',
                chunk,
                filename: `${filename}.part${partIndex}`,
                continueToken: continueToken!,
              };

      const res = await sendPart(part);
      bytesSent += chunk.length;

      if (isLast) {
        if (res.kind !== 'final') {
          throw new Error(
            `Streamed upload for "${filename}" did not return a final file id on the last chunk (${bytesSent}/${totalSize} bytes sent).`,
          );
        }
        if (bytesSent !== totalSize) {
          throw new Error(
            `Internal size-accounting mismatch: sent ${bytesSent} bytes but declared ${totalSize}.`,
          );
        }
        if (pendingBytes > 0) {
          throw new Error(
            `Content-Length mismatch: declared ${totalSize} bytes but source still held ${pendingBytes} buffered bytes after the final part was sent.`,
          );
        }
        while (!sourceDone) {
          await pullOneInto();
          if (pendingBytes > 0) {
            throw new Error(
              `Content-Length mismatch: declared ${totalSize} bytes but source kept delivering more after the final part was sent.`,
            );
          }
        }
        return toResult(res);
      }

      if (res.kind !== 'continue') {
        throw new Error(
          `Streamed upload for "${filename}" returned a final file id after only ${bytesSent}/${totalSize} bytes — server misread totalSize.`,
        );
      }
      continueToken = res.continueToken;
      partIndex++;
    }
    throw new Error(
      `Unreachable — streamed upload loop for "${filename}" exited without handling the last chunk.`,
    );
  } finally {
    if (typeof iter.return === 'function') {
      await iter.return(undefined).catch(() => {
        /* ignore */
      });
    }
  }
}

function toResult(res: Extract<UploadPartResponse, { kind: 'final' }>): UploadUserFileResult {
  return {
    fileId: res.file.id,
    name: res.file.name,
    size: res.file.size,
    expiresAt: res.file.expiresAt,
    raw: res.raw,
  };
}

export const simplyprintChunkedUpload = {
  DEFAULT_CHUNK_SIZE,
  extractFilesApiId,
  driveChunkedUpload,
  driveStreamedUpload,
};

export interface ExtractedFile {
  id: string;
  name?: string;
  size?: number;
  expiresAt?: string;
}

export interface UploadUserFileResult {
  fileId: string;
  name?: string;
  size?: number;
  expiresAt?: string;
  raw: unknown;
}

export type UploadPart =
  | { kind: 'only'; chunk: Uint8Array; filename: string }
  | { kind: 'first'; chunk: Uint8Array; filename: string; totalSize: number }
  | { kind: 'continue'; chunk: Uint8Array; filename: string; continueToken: string };

export type UploadPartResponse =
  | { kind: 'continue'; continueToken: string }
  | { kind: 'final'; file: ExtractedFile; raw: unknown };

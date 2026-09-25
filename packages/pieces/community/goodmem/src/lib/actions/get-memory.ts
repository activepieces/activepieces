import { createAction, Property } from '@activepieces/pieces-framework';
import { Goodmem, NotFoundError } from '@pairsystems/goodmem';
import { createGoodmemClient } from '../client';
import { goodmemAuth } from '../auth';

export const getMemory = createAction({
  auth: goodmemAuth,
  name: 'get_memory',
  displayName: 'Get Memory',
  description:
    'Fetch a specific memory record by its ID, including metadata, processing status, and optionally the original content.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a single GoodMem memory by its ID and returns its metadata and processing status, optionally including the original document content. Use it when you already have a memory ID (e.g. from Create Memory or a retrieval result) and need its full details. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    memoryId: Property.ShortText({
      displayName: 'Memory ID',
      description:
        'The UUID of the memory to fetch (returned by Create Memory)',
      required: true,
    }),
    includeContent: Property.Checkbox({
      displayName: 'Include Content',
      description:
        'Fetch the original document content of the memory in addition to its metadata',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { memoryId, includeContent = true } = context.propsValue;
    const client = createGoodmemClient(context.auth.props);
    const memory = await client.memories.get(memoryId);
    if (!includeContent) {
      return { success: true, memory };
    }
    const download = await fetchContent({ client, memoryId });
    if (!download.ok) {
      return { success: true, partial: true, memory, contentError: download.error };
    }
    const contentType =
      download.response.headers.get('content-type') ?? memory.contentType;
    if (isTextual(contentType)) {
      const decoded = decodeText({ bytes: download.bytes, contentType });
      if (!decoded.ok) {
        return { success: true, partial: true, memory, contentError: decoded.error };
      }
      return { success: true, memory, content: decoded.content, contentType };
    }
    const filename = memory.metadata?.['filename'];
    const file = await context.files.write({
      fileName: typeof filename === 'string' ? filename : memoryId,
      data: Buffer.from(download.bytes),
    });
    return { success: true, memory, file, contentType };
  },
});

async function fetchContent({
  client,
  memoryId,
}: {
  client: Goodmem;
  memoryId: string;
}): Promise<ContentResult> {
  try {
    const { bytes, response } = await client.memories.contentWithResponse(
      memoryId
    );
    return { ok: true, bytes, response };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

function isTextual(contentType: string | undefined): boolean {
  const lowered = contentType?.toLowerCase();
  return Boolean(
    lowered &&
      (lowered.startsWith('text/') ||
        lowered.includes('json') ||
        lowered.includes('xml'))
  );
}

function decodeText({
  bytes,
  contentType,
}: {
  bytes: Uint8Array;
  contentType: string | undefined;
}): DecodeResult {
  const charset =
    contentType?.match(/;\s*charset\s*=\s*"?([^";\s]+)/i)?.[1] ?? 'utf-8';
  try {
    return {
      ok: true,
      content: new TextDecoder(charset, { fatal: true }).decode(bytes),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

type ContentResult =
  | { ok: true; bytes: Uint8Array; response: Response }
  | { ok: false; error: string };

type DecodeResult = { ok: true; content: string } | { ok: false; error: string };

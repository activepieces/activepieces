import { createAction, Property } from '@activepieces/pieces-framework';
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
    try {
      const { bytes, response } = await client.memories.contentWithResponse(
        memoryId
      );
      const contentType =
        response.headers.get('content-type') ?? memory.contentType;
      if (
        contentType?.toLowerCase().startsWith('text/') ||
        contentType?.toLowerCase().includes('json') ||
        contentType?.toLowerCase().includes('xml')
      ) {
        const charset =
          contentType?.match(/;\s*charset\s*=\s*"?([^";\s]+)/i)?.[1] ?? 'utf-8';
        return {
          success: true,
          memory,
          content: new TextDecoder(charset, { fatal: true }).decode(bytes),
          contentType,
        };
      }
      const filename = memory.metadata?.['filename'];
      const file = await context.files.write({
        fileName: typeof filename === 'string' ? filename : memoryId,
        data: Buffer.from(bytes),
      });
      return { success: true, memory, file, contentType };
    } catch (error) {
      return {
        success: true,
        partial: true,
        memory,
        contentError: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

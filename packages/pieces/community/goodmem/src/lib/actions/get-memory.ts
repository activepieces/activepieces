import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { goodmemAuth } from '../../index';
import { extractAuthFromContext, goodmemOutputSchemas } from '../common';
import { goodmemApi, goodmemBuilders } from '../common/client';

export const getMemory = createAction({
  auth: goodmemAuth,
  name: 'get_memory',
  classification: 'READ',
  displayName: 'Get Memory',
  description: 'Fetch a specific memory record by its ID, including metadata, processing status, and optionally the original content.',
  audience: 'both',
  aiMetadata: { description: 'Looks up a single GoodMem memory by its ID and returns its metadata and processing status, optionally including the original document content. Use it when you already have a memory ID (from Store Memory, List Memories or a retrieval result) and need its full details. Fails if the memory does not exist. Read-only and idempotent.', idempotent: true },
  outputSchema: goodmemOutputSchemas.getMemory,
  props: {
    memoryId: Property.ShortText({
      displayName: 'Memory ID',
      description: 'The UUID of the memory to fetch (returned by Create Memory)',
      required: true,
    }),
    includeContent: Property.Checkbox({
      displayName: 'Include Content',
      description: 'Fetch the original document content of the memory in addition to its metadata',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { memoryId, includeContent } = context.propsValue;
    const auth = extractAuthFromContext(context.auth);
    const memory = await goodmemApi.request({
      auth,
      method: HttpMethod.GET,
      path: goodmemApi.memoryPath(goodmemBuilders.requireText({ value: memoryId, label: 'Memory ID' })),
      action: 'get memory',
      query: { includeContent: includeContent === false ? 'false' : 'true' },
    });
    return { success: true, memory };
  },
});

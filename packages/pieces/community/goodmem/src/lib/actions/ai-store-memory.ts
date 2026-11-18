import { createAction, Property } from '@activepieces/pieces-framework';
import { goodmemAuth } from '../../index';
import { extractAuthFromContext, goodmemOutputSchemas } from '../common';
import { goodmemApi, goodmemBuilders } from '../common/client';

export const aiStoreMemory = createAction({
  auth: goodmemAuth,
  name: 'ai_store_memory',
  classification: 'WRITE',
  displayName: 'Store Memory',
  description: 'Store text as a new memory in a space.',
  audience: 'ai',
  aiMetadata: { description: 'Stores a piece of text as a new memory in a GoodMem space; it is chunked and embedded in the background and becomes searchable with Retrieve Memories after a short delay. Needs a space ID (from List Spaces or Create Space). Optional source, author, tags and extra metadata are saved with it and can be used in List Memories filters. Not idempotent: every call creates a separate memory.', idempotent: false },
  outputSchema: goodmemOutputSchemas.memory,
  props: {
    spaceId: Property.ShortText({
      displayName: 'Space ID',
      description: 'The ID of the space to store the memory in',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text content to store',
      required: true,
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description: 'Where the content came from, stored in metadata.source',
      required: false,
    }),
    author: Property.ShortText({
      displayName: 'Author',
      description: 'Author of the content, stored in metadata.author',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags stored in metadata.tags',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Additional Metadata',
      description: 'Extra key-value metadata as a JSON object',
      required: false,
    }),
  },
  async run(context) {
    const { spaceId, text, source, author, tags, metadata } = context.propsValue;
    goodmemBuilders.requireText({ value: text, label: 'Text' });
    const body = goodmemBuilders.buildMemoryRequestBody({
      spaceId: goodmemBuilders.requireText({ value: spaceId, label: 'Space ID' }),
      textContent: text,
      metadata: goodmemBuilders.buildMemoryMetadata({
        source: source ?? undefined,
        author: author ?? undefined,
        tags: tags ?? undefined,
        metadata,
      }),
    });
    return goodmemApi.createMemoryRequest({ auth: extractAuthFromContext(context.auth), body });
  },
});

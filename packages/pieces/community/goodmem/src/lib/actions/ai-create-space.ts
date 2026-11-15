import { createAction, Property } from '@activepieces/pieces-framework';
import { goodmemAuth } from '../../index';
import { extractAuthFromContext, goodmemOutputSchemas } from '../common';
import { goodmemApi, goodmemBuilders } from '../common/client';

export const aiCreateSpace = createAction({
  auth: goodmemAuth,
  name: 'ai_create_space',
  classification: 'WRITE',
  displayName: 'Create Space',
  description: 'Create a space, or reuse the existing space with the same name.',
  audience: 'ai',
  aiMetadata: { description: 'Provisions a GoodMem space (a named container of memories with one embedder model) and returns its ID, which Store Memory and Retrieve Memories need. Needs an embedder ID (get one from List Models). Idempotent on the name: if a space with exactly this name already exists, its ID is returned with reused=true and nothing is created.', idempotent: true },
  outputSchema: goodmemOutputSchemas.space,
  props: {
    name: Property.ShortText({
      displayName: 'Space Name',
      description: 'A unique name for the space',
      required: true,
    }),
    embedderId: Property.ShortText({
      displayName: 'Embedder ID',
      description: 'The ID of the embedder model (from List Models)',
      required: true,
    }),
    chunkSize: Property.Number({
      displayName: 'Chunk Size',
      description: 'Characters per chunk when splitting documents (default 256)',
      required: false,
    }),
    chunkOverlap: Property.Number({
      displayName: 'Chunk Overlap',
      description: 'Overlap between chunks (default 25, smaller than Chunk Size)',
      required: false,
    }),
  },
  async run(context) {
    const { name, embedderId, chunkSize, chunkOverlap } = context.propsValue;
    return goodmemApi.createOrReuseSpace({
      auth: extractAuthFromContext(context.auth),
      name: goodmemBuilders.requireText({ value: name, label: 'Space Name' }),
      embedderId: goodmemBuilders.requireText({ value: embedderId, label: 'Embedder ID' }),
      chunkingConfig: goodmemBuilders.buildChunkingConfig({
        chunkSize: chunkSize ?? undefined,
        chunkOverlap: chunkOverlap ?? undefined,
      }),
    });
  },
});

import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { goodmemAuth } from '../../index';
import { extractAuthFromContext, goodmemOutputSchemas } from '../common';
import { goodmemApi, goodmemBuilders } from '../common/client';

export const deleteMemory = createAction({
  auth: goodmemAuth,
  name: 'delete_memory',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Memory',
  description: 'Permanently delete a memory and its associated chunks and vector embeddings.',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a GoodMem memory and its associated chunks and vector embeddings, identified by memory ID. Use it to remove stored content from a space. Not idempotent: deleting a memory that no longer exists fails with a not-found error.', idempotent: false },
  outputSchema: goodmemOutputSchemas.deleteMemory,
  props: {
    memoryId: Property.ShortText({
      displayName: 'Memory ID',
      description: 'The UUID of the memory to delete (returned by Create Memory)',
      required: true,
    }),
  },
  async run(context) {
    const auth = extractAuthFromContext(context.auth);
    const memoryId = goodmemBuilders.requireText({ value: context.propsValue.memoryId, label: 'Memory ID' });
    await goodmemApi.request({
      auth,
      method: HttpMethod.DELETE,
      path: goodmemApi.memoryPath(memoryId),
      action: 'delete memory',
    });
    return { success: true, memoryId, message: 'Memory deleted successfully' };
  },
});

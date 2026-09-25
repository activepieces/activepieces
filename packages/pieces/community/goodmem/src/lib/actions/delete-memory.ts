import { createAction, Property } from '@activepieces/pieces-framework';
import { createGoodmemClient } from '../client';
import { goodmemAuth } from '../auth';

export const deleteMemory = createAction({
  auth: goodmemAuth,
  name: 'delete_memory',
  displayName: 'Delete Memory',
  description:
    'Permanently delete a memory and its associated chunks and vector embeddings.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a GoodMem memory and its associated chunks and vector embeddings, identified by memory ID. Use it to remove stored content from a space. This is destructive but idempotent: once the memory is gone, repeating the call with the same ID leaves the end state unchanged.',
    idempotent: true,
  },
  props: {
    memoryId: Property.ShortText({
      displayName: 'Memory ID',
      description:
        'The UUID of the memory to delete (returned by Create Memory)',
      required: true,
    }),
  },
  async run(context) {
    const { memoryId } = context.propsValue;
    await createGoodmemClient(context.auth.props).memories.delete(memoryId);
    return { success: true, memoryId };
  },
});

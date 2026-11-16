import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { memClient, memSchemas } from '../common';
import { memProps } from '../common/props';

export const updateCollectionAction = createAction({
  auth: memAuth,
  name: 'update_collection',
  classification: 'WRITE',
  displayName: 'Update Collection',
  description: 'Rename a collection or change its description.',
  audience: 'both',
  aiMetadata: {
    description: 'Updates the title and/or description of a Mem collection; omitted fields stay unchanged. Idempotent: repeating with the same values leaves the same state.',
    idempotent: true,
  },
  props: {
    collection_id: memProps.collectionDropdown({ displayName: 'Collection', description: 'The collection to update.', required: true }),
    title: Property.ShortText({ displayName: 'Title', description: 'New title. Leave empty to keep the current one.', required: false }),
    description: Property.LongText({ displayName: 'Description', description: 'New description. Leave empty to keep the current one.', required: false }),
  },
  outputSchema: memSchemas.createdCollection,
  async run(context) {
    const { collection_id, title, description } = context.propsValue;
    if (!title && !description) {
      throw new Error('Provide a new title or description to update the collection.');
    }
    return memClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PATCH,
      path: memClient.encodePath`/collections/${collection_id}`,
      body: { ...(title ? { title } : {}), ...(description ? { description } : {}) },
    });
  },
});

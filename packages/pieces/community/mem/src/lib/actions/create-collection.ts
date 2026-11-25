import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { memClient, memSchemas } from '../common';

export const createCollectionAction = createAction({
  auth: memAuth,
  name: 'create_collection',
  classification: 'WRITE',
  displayName: 'Create Collection',
  description: 'Create a new collection to group notes.',
  audience: 'both',
  aiMetadata: {
    description: 'Creates a Mem collection with a title and optional description and returns its ID. Use Add Note to Collection to put notes in it. Not idempotent: each call creates another collection, even with the same title.',
    idempotent: false,
  },
  props: {
    title: Property.ShortText({ displayName: 'Title', description: 'Collection title (up to 1,000 characters).', required: true }),
    description: Property.LongText({ displayName: 'Description', description: 'Optional collection description.', required: false }),
  },
  outputSchema: memSchemas.createdCollection,
  async run(context) {
    const { title, description } = context.propsValue;
    return memClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/collections',
      body: { title, ...(description ? { description } : {}) },
    });
  },
});

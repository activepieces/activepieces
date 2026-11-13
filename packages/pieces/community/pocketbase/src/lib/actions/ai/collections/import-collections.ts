import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseSuccessOutputSchema } from '../../../output-schemas';

export const importCollectionsAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_import_collections',
  outputSchema: pocketbaseSuccessOutputSchema,
  displayName: 'Import Collections',
  description: 'Creates or replaces collections from a list of collection definitions.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Imports collection definitions in one transaction: matching collections (by ID) are replaced, new ones are created. With Delete Missing set to true, every collection not in the list is deleted with its records. Get the current definitions with List Collections.',
    idempotent: true,
  },
  props: {
    collections: Property.Json({
      displayName: 'Collections',
      description: 'Array of full collection definitions, in the same shape List Collections returns.',
      required: true,
    }),
    deleteMissing: Property.StaticDropdown({
      displayName: 'Delete Missing',
      description: 'true deletes every existing collection (and its records) that is not in the list. Defaults to false.',
      required: false,
      options: {
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
  },
  async run(context) {
    const { collections, deleteMissing } = context.propsValue;
    if (deleteMissing !== undefined && deleteMissing !== 'true' && deleteMissing !== 'false') {
      throw new Error('deleteMissing must be "true" or "false".');
    }
    await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: '/api/collections/import',
      body: { collections, ...(deleteMissing ? { deleteMissing: deleteMissing === 'true' } : {}) },
    });
    return { success: true };
  },
});

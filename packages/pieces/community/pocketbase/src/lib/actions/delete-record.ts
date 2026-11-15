import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../auth';
import { pocketbaseClient } from '../common/client';
import { pocketbaseProps } from '../common/props';
import { pocketbaseSuccessOutputSchema } from '../output-schemas';

export const deleteRecordAction = createAction({
  name: 'deleteRecord',
  outputSchema: pocketbaseSuccessOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Record',
  description: 'Deletes a single record from a collection',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes one record from a PocketBase collection by its record ID. Use when you need to remove a specific record you can identify by ID. Idempotent on the end state — the record ends up absent — though a repeat call against an already-deleted ID will error since the record no longer exists.', idempotent: true },
  auth: pocketbaseAuth,
  props: {
    collection: pocketbaseProps.collection({ required: true }),
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'ID of the record to delete',
      required: true,
    }),
  },
  async run(context) {
    const { collection, recordId } = context.propsValue;

    await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/api/collections/${encodeURIComponent(collection)}/records/${encodeURIComponent(recordId)}`,
    });

    return { success: true };
  },
});

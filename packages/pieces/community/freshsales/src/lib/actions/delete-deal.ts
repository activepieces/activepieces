import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { deleteOutputSchema } from '../output-schemas';

export const deleteDeal = createAction({
  auth: freshsalesAuth,
  name: 'delete_deal',
  displayName: 'Delete Deal',
  description: 'Delete a deal by its ID',
  audience: 'both',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a Freshsales deal by numeric ID. A second call for the same ID fails with a not-found error. Confirm the ID with Get Deal first.',
    idempotent: true,
  },
  outputSchema: deleteOutputSchema,
  props: {
    deal_id: Property.ShortText({
      displayName: 'Deal ID',
      description: 'ID of the deal to delete',
      placeholder: '16000123456',
      required: true,
    }),
  },
  async run(context) {
    const id = freshsalesClient.requireId({ value: context.propsValue.deal_id, field: 'Deal ID' });
    await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/api/deals/${id}`,
    });
    return { id, deleted: true };
  },
});

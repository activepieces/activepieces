import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseBatchRecordsOutputSchema } from '../../../output-schemas';

export const batchRecordsAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_batch_records',
  outputSchema: pocketbaseBatchRecordsOutputSchema,
  displayName: 'Batch Records',
  description: 'Runs several record create, update, upsert and delete requests in one transaction.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Runs up to the instance\'s batch limit of record create, update, upsert and delete requests as one transaction: either all succeed or none are applied. Requires the batch API to be enabled in settings (see Get Settings / Update Settings). Use it for multi-record writes; for a single record use Create Record, Update Record or Delete Record.',
    idempotent: false,
  },
  props: {
    requests: Property.Json({
      displayName: 'Requests',
      description: 'Array of requests, each { "method": "POST" | "PATCH" | "PUT" | "DELETE", "url": "/api/collections/<collection>/records[/<id>]", "body": { ...fields } }. PUT on the records URL is an upsert by "id" in the body.',
      required: true,
    }),
  },
  async run(context) {
    const results = await pocketbaseClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/api/batch',
      body: { requests: context.propsValue.requests },
    });
    return { results, count: results.length };
  },
});

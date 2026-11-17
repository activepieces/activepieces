import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseClient } from '../../../common/client';
import { pocketbasePreviewViewQueryOutputSchema } from '../../../output-schemas';

export const previewViewQueryAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_preview_view_query',
  outputSchema: pocketbasePreviewViewQueryOutputSchema,
  displayName: 'Preview View Query',
  description: 'Checks a view collection query and returns the fields and a sample row it would produce.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Validates a SQL SELECT for a view collection without saving anything, and returns the fields it would produce plus a sample row. Use it before Create Collection with type view.',
    idempotent: true,
  },
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description: 'SQL SELECT that returns an "id" column, e.g. "SELECT id, title FROM posts".',
      required: true,
    }),
  },
  async run(context) {
    return await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/api/collections/meta/dry-run-view',
      body: { query: context.propsValue.query },
    });
  },
});

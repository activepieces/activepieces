import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseAiProps } from '../../../common/ai-props';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseUtils } from '../../../common/utils';
import { pocketbaseListCollectionsOutputSchema } from '../../../output-schemas';

export const listCollectionsAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_list_collections',
  outputSchema: pocketbaseListCollectionsOutputSchema,
  displayName: 'List Collections',
  description: 'Lists the collections in the instance with their fields and rules.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists one page of collections, each with its name, ID, type (base, auth or view), fields and API rules. Use it to find a collection name before working with its records, and page with Page while page < totalPages.',
    idempotent: true,
  },
  props: {
    filter: pocketbaseAiProps.filter({ required: false }),
    sort: pocketbaseAiProps.sort({ required: false }),
    page: pocketbaseAiProps.page({ required: false }),
    perPage: pocketbaseAiProps.perPage({ required: false }),
  },
  async run(context) {
    return await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/api/collections',
      query: pocketbaseUtils.pageQuery(context.propsValue),
    });
  },
});

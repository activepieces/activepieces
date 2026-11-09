import { createAction } from '@activepieces/pieces-framework';
import type { RichLongRunningOperation } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListCompatibleHubContentTypesOutputSchema } from '../../../output-schemas';

export const listListOperationsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_list_operations',
  outputSchema: microsoftSharepointListCompatibleHubContentTypesOutputSchema,
  displayName: 'List List Operations',
  description: 'Lists the long-running operations on a SharePoint list.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the long-running operations on a SharePoint list, such as column indexing, with their IDs and status, one page at a time. Use Get List Operation to check one operation again.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<RichLongRunningOperation>({
      auth,
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/operations`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});

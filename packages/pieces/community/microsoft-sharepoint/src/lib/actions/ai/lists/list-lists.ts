import { createAction } from '@activepieces/pieces-framework';
import type { List } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListListsOutputSchema } from '../../../output-schemas';

export const listListsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_lists',
  outputSchema: microsoftSharepointListListsOutputSchema,
  displayName: 'List Lists',
  description: 'Lists the lists and document libraries of a SharePoint site.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the lists and document libraries of a SharePoint site with their IDs, names, templates and URLs, one page at a time. Use Get List to read one list again.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<List>({
      auth,
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/lists`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});

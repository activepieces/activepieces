import { createAction } from '@activepieces/pieces-framework';
import type { ListItemVersion } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListListItemVersionsOutputSchema } from '../../../output-schemas';

export const listListItemVersionsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_list_item_versions',
  outputSchema: microsoftSharepointListListItemVersionsOutputSchema,
  displayName: 'List List Item Versions',
  description: 'Lists the versions of a SharePoint list item.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the versions of a SharePoint list item with their version IDs and modification details, one page at a time. Use Get List Item Version for the field values of one version.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    listItemId: microsoftSharePointAiProps.listItemId({ required: true }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<ListItemVersion>({
      auth,
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/items/${encodeURIComponent(propsValue.listItemId)}/versions`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});

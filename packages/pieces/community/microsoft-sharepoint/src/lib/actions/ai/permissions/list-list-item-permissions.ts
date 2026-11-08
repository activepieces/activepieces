import { createAction } from '@activepieces/pieces-framework';
import type { Permission } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListListItemPermissionsOutputSchema } from '../../../output-schemas';

export const listListItemPermissionsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_list_item_permissions',
  outputSchema: microsoftSharepointListListItemPermissionsOutputSchema,
  displayName: 'List List Item Permissions',
  description: 'Lists who has access to an item in a SharePoint list.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the permissions on one SharePoint list item with their IDs, roles and grantees, one page at a time. Requires the signed-in user to be able to manage permissions on the site; use List List Permissions for the whole list.',
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
    return await microsoftSharePointClient.list<Permission>({
      auth,
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/items/${encodeURIComponent(propsValue.listItemId)}/permissions`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});

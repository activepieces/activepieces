import { createAction } from '@activepieces/pieces-framework';
import type { Permission } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListListItemPermissionsOutputSchema } from '../../../output-schemas';

export const listListPermissionsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_list_permissions',
  outputSchema: microsoftSharepointListListItemPermissionsOutputSchema,
  displayName: 'List List Permissions',
  description: 'Lists who has access to a SharePoint list.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the permissions on a SharePoint list with their IDs, roles and grantees, one page at a time. Requires the signed-in user to be able to manage permissions on the site; use List List Item Permissions for a single item.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<Permission>({
      auth,
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/permissions`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});

import { microsoftSharePointAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { microsoftSharePointCommon } from '../common';
import { Client } from '@microsoft/microsoft-graph-client';

export const deleteListItemAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_delete_list_item',
  displayName: 'Delete List Item',
  description: 'Deletes an existing item from a list.',
  props: {
    siteId: microsoftSharePointCommon.siteId,
    listId: microsoftSharePointCommon.listId,
    listItemId: microsoftSharePointCommon.listItemId,
  },
  async run(context) {
    const { siteId, listId, listItemId } = context.propsValue;

    const cloud = context.auth.props?.['cloud'] as string | undefined;
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
      baseUrl: getGraphBaseUrl(cloud),
    });

    return await client
      .api(`/sites/${siteId}/lists/${listId}/items/${listItemId}`)
      .delete();
  },
});

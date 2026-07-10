import { microsoftSharePointAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { microsoftSharePointCommon } from '../common';
import { Client } from '@microsoft/microsoft-graph-client';

export const updateListItemAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_update_list_item',
  displayName: 'Update List Item',
  description: 'Updates an existing item in a list.',
  audience: 'both',
  aiMetadata: {
    description: 'Updates the column field values of an existing item in a SharePoint list, identified by its list item ID on a given site. Use to edit a known row rather than create one. Requires a valid item ID; idempotent, since re-applying the same field values leaves the item in the same final state.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointCommon.siteId,
    listId: microsoftSharePointCommon.listId,
    listItemId: microsoftSharePointCommon.listItemId,
    listColumns: microsoftSharePointCommon.listColumns,
  },
  async run(context) {
    const { siteId, listId, listItemId, listColumns } = context.propsValue;

    const cloud = context.auth.props?.['cloud'] as string | undefined;
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
      baseUrl: getGraphBaseUrl(cloud),
    });
    const fieldWithArrayValues: Record<string, string> = {};

    Object.entries(listColumns).forEach(([key, value]) => {
      // https://learn.microsoft.com/en-us/answers/questions/1517379/upload-multiple-choice-fields-item-in-sharepoint-w
      if (Array.isArray(value)) {
        fieldWithArrayValues[`${key}@odata.type`] = 'Collection(Edm.String)';
      }
    });
    const itemInput = { ...listColumns, ...fieldWithArrayValues };

    return await client
      .api(`/sites/${siteId}/lists/${listId}/items/${listItemId}/fields`)
      .patch(itemInput);
  },
});

import { microsoftSharePointAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { microsoftSharePointCommon } from '../common';
import { Client } from '@microsoft/microsoft-graph-client';

export const findListItemAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_search_list_item',
  displayName: 'Find List Item',
  description: 'Finds a item in a list based on name.',
  audience: 'both',
  aiMetadata: {
    description: 'Looks up items in a SharePoint list by exact Title match on a given site, returning the matching items with their fields. Use to resolve a list item ID (or confirm existence) before updating or deleting it. Read-only and idempotent; matches only the Title column, not arbitrary fields.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointCommon.siteId,
    listId: microsoftSharePointCommon.listId,
    searchValue: Property.ShortText({
      displayName: 'Title',
      description: 'Item title to search',
      required: true,
    }),
  },
  async run(context) {
    const { siteId, listId, searchValue } = context.propsValue;

    const cloud = context.auth.props?.['cloud'] as string | undefined;
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
      baseUrl: getGraphBaseUrl(cloud),
    });

    // Escaping single quotes
    const title = searchValue.replaceAll("'", "''");
    return await client
      .api(
        `/sites/${siteId}/lists/${listId}/items?$expand=fields&filter=fields/Title eq '${title}'`
      )
      .headers({ Prefer: 'HonorNonIndexedQueriesWarningMayFailRandomly' })
      .get();
  },
});

import { microsoftSharePointAuth } from '../../';
import { createAction } from '@activepieces/pieces-framework';
import { microsoftSharePointCommon } from '../common';
import { Client } from '@microsoft/microsoft-graph-client';

export const publishPageAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_publish_page',
  displayName: 'Publish Page',
  description: 'Changes a SharePoint page status to "Published."',
  props: {
    siteId: microsoftSharePointCommon.siteId,

    pageId: microsoftSharePointCommon.pageId,
  },
  async run(context) {
    const { siteId, pageId } = context.propsValue;

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });


    await client
      .api(`/sites/${siteId}/pages/${pageId}/microsoft.graph.sitePage/publish`)
      .post({});

    return {};
  },
});
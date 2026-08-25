import { microsoftSharePointAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { microsoftSharePointCommon } from '../common';
import { Client } from '@microsoft/microsoft-graph-client';

export const publishPageAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_publish_page',
  displayName: 'Publish Page',
  description: 'Publishes a SharePoint page, making it available to all users. If the page is checked out, it will be automatically checked in. Note: Pages with active approval flows will not publish until approval is complete.',
  audience: 'both',
  aiMetadata: {
    description: 'Publishes a SharePoint site page by its page ID on a given site, making the latest version visible to all users (auto-checking it in if needed). Use to make page edits live. Idempotent: re-publishing an already-published page leaves it published. A page awaiting an approval flow will not publish until approval completes.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointCommon.siteId,
    pageId: microsoftSharePointCommon.pageId,
  },
  async run(context) {
    const { siteId, pageId } = context.propsValue;

    const cloud = context.auth.props?.['cloud'] as string | undefined;
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
      baseUrl: getGraphBaseUrl(cloud),
    });

    try {
      await client
        .api(`/sites/${siteId}/pages/${pageId}/microsoft.graph.sitePage/publish`)
        .post({});

      return {
        success: true,
        message: 'Page published successfully',
        pageId: pageId,
        siteId: siteId,
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        throw new Error(`Page not found. Please verify the page ID: ${pageId}`);
      }
      if (error.statusCode === 403) {
        throw new Error('Insufficient permissions to publish this page. Requires Files.ReadWrite or higher.');
      }
      if (error.statusCode === 409) {
        throw new Error('Page cannot be published. It may be awaiting approval or already published.');
      }
      throw new Error(`Failed to publish page: ${error.message || 'Unknown error'}`);
    }
  },
});
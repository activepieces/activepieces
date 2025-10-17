import { microsoftSharePointAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftSharePointCommon } from '../common';
import { Client } from '@microsoft/microsoft-graph-client';

export const getSiteInformationAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_site_information',
  displayName: 'Get Site Information',
  description: 'Fetch metadata of a SharePoint site (site ID, title, URL, description, etc.).',
  props: {
    siteId: microsoftSharePointCommon.siteId,
    select: Property.ShortText({
        displayName: 'Select Fields (Optional)',
        description: 'A comma-separated list of properties to return. If left blank, all default properties are returned. Example: `id,displayName,webUrl,description`',
        required: false,
    }),
  },
  async run(context) {
    const { siteId, select } = context.propsValue;

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });

    const request = client.api(`/sites/${siteId}`);
    
    if (select) {
        request.select(select.split(',').map(s => s.trim()));
    }

    return await request.get();
  },
});
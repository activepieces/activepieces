import { microsoftSharePointAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Site } from '@microsoft/microsoft-graph-types';

export const findSiteAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_find_site',
  displayName: 'Find Site',
  description: 'Search for SharePoint sites by name and return matching results.',
  props: {
    searchTerm: Property.ShortText({
      displayName: 'Site Name',
      description: 'The name or keyword to search for.',
      required: true,
    }),
  },
  async run(context) {
    const { searchTerm } = context.propsValue;

    const cloud = context.auth.props?.['cloud'] as string | undefined;
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
      baseUrl: getGraphBaseUrl(cloud),
    });

    const sites: Pick<Site, 'id' | 'displayName' | 'name' | 'webUrl'>[] = [];

    let response: PageCollection = await client
      .api(`/sites?search=${encodeURIComponent(searchTerm)}&$select=displayName,id,name,webUrl`)
      .get();

    while (response.value.length > 0) {
      for (const site of response.value as Site[]) {
        sites.push({
          id: site.id,
          displayName: site.displayName,
          name: site.name,
          webUrl: site.webUrl,
        });
      }
      if (response['@odata.nextLink']) {
        response = await client.api(response['@odata.nextLink']).get();
      } else {
        break;
      }
    }

    return { sites };
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import type { Site } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointGetRootSiteOutputSchema } from '../../../output-schemas';

export const getSiteByPathAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_site_by_path',
  outputSchema: microsoftSharepointGetRootSiteOutputSchema,
  displayName: 'Get Site by Path',
  description: 'Gets a SharePoint site from its hostname and server-relative path.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets a SharePoint site from its URL parts, such as hostname "contoso.sharepoint.com" and path "/sites/marketing", and returns its site ID. Leave the path empty for the root site of that hostname. Use Find Site instead when you only know the site name.',
    idempotent: true,
  },
  props: {
    hostname: Property.ShortText({
      displayName: 'Hostname',
      description: 'SharePoint hostname, like "contoso.sharepoint.com". Get Root Site returns it.',
      required: true,
    }),
    relativePath: Property.ShortText({
      displayName: 'Server-Relative Path',
      description: 'Path of the site under the hostname, like "/sites/marketing". Leave empty for the root site.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { hostname, relativePath } = propsValue;
    const host = encodeURIComponent(hostname);
    const path = relativePath
      ? `/sites/${host}:${relativePath.startsWith('/') ? '' : '/'}${encodeURI(relativePath)}`
      : `/sites/${host}`;
    const site: Site = await microsoftSharePointClient.create({ auth }).api(path).get();
    return site;
  },
});

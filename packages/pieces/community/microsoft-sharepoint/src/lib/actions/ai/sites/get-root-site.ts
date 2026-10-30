import { createAction } from '@activepieces/pieces-framework';
import type { Site } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointGetRootSiteOutputSchema } from '../../../output-schemas';

export const getRootSiteAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_root_site',
  outputSchema: microsoftSharepointGetRootSiteOutputSchema,
  displayName: 'Get Root Site',
  description: "Gets the organization's root SharePoint site.",
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Gets the tenant's root SharePoint site with its ID, name, URL and hostname. Use it to learn the SharePoint hostname for Get Site by Path, or as a starting site for List Subsites.",
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const site: Site = await microsoftSharePointClient.create({ auth }).api('/sites/root').get();
    return site;
  },
});

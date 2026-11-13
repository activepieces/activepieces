import { createAction } from '@activepieces/pieces-framework';
import type { Drive } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListSiteDrivesOutputSchema } from '../../../output-schemas';

export const listSiteDrivesAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_site_drives',
  outputSchema: microsoftSharepointListSiteDrivesOutputSchema,
  displayName: 'List Site Drives',
  description: 'Lists the document libraries (drives) of a SharePoint site.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the document libraries (drives) of a SharePoint site with their IDs, names and URLs, one page at a time. Use Get Site Default Drive when you only need the main Documents library.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<Drive>({
      auth,
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/drives`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});

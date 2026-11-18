import { createAction } from '@activepieces/pieces-framework';
import type { Site } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListCompatibleHubContentTypesOutputSchema } from '../../../output-schemas';

export const listSubsitesAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_subsites',
  outputSchema: microsoftSharepointListCompatibleHubContentTypesOutputSchema,
  displayName: 'List Subsites',
  description: 'Lists the subsites of a SharePoint site.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the direct subsites of a SharePoint site with their IDs, names and URLs, one page at a time. Use Find Site to search all sites by name instead.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<Site>({
      auth,
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/sites`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});

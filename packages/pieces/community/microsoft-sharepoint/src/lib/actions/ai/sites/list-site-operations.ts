import { createAction } from '@activepieces/pieces-framework';
import type { RichLongRunningOperation } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListCompatibleHubContentTypesOutputSchema } from '../../../output-schemas';

export const listSiteOperationsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_site_operations',
  outputSchema: microsoftSharepointListCompatibleHubContentTypesOutputSchema,
  displayName: 'List Site Operations',
  description: 'Lists the long-running operations on a SharePoint site.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the long-running operations on a SharePoint site, such as column indexing, with their IDs and status, one page at a time. Use Get Site Operation to check one operation again.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<RichLongRunningOperation>({
      auth,
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/operations`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});

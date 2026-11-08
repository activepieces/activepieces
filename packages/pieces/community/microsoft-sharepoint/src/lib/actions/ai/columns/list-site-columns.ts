import { createAction } from '@activepieces/pieces-framework';
import type { ColumnDefinition } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListSiteColumnsOutputSchema } from '../../../output-schemas';

export const listSiteColumnsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_site_columns',
  outputSchema: microsoftSharepointListSiteColumnsOutputSchema,
  displayName: 'List Site Columns',
  description: 'Lists the columns of a SharePoint site.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the columns defined in a SharePoint site with their IDs, names and types, one page at a time. List List Columns returns the columns of one list.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<ColumnDefinition>({
      auth,
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/columns`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});

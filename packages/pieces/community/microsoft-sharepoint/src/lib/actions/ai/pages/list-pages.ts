import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListPagesOutputSchema } from '../../../output-schemas';

export const listPagesAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_pages',
  outputSchema: microsoftSharepointListPagesOutputSchema,
  displayName: 'List Pages',
  description: 'Lists the pages of a SharePoint site.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the pages in the Site Pages library of a SharePoint site with their IDs, names, titles and publishing state, one page at a time. Use Get Page for one page with its sections and web parts.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<Record<string, unknown>>({
      auth,
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/pages`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});

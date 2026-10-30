import { createAction } from '@activepieces/pieces-framework';
import type { ContentType } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListContentTypesOutputSchema } from '../../../output-schemas';

export const listContentTypesAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_content_types',
  outputSchema: microsoftSharepointListContentTypesOutputSchema,
  displayName: 'List Content Types',
  description: 'Lists the content types of a SharePoint site.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the content types of a SharePoint site, including those it inherits, with their IDs, names and groups, one page at a time. Use List List Content Types for the content types attached to one list.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<ContentType>({
      auth,
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/contentTypes`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});

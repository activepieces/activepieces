import { createAction } from '@activepieces/pieces-framework';
import type { ContentType } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListCompatibleHubContentTypesOutputSchema } from '../../../output-schemas';

export const listCompatibleHubContentTypesForListAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_compatible_hub_content_types_for_list',
  outputSchema: microsoftSharepointListCompatibleHubContentTypesOutputSchema,
  displayName: 'List Compatible Hub Content Types for List',
  description: 'Lists the Content Type Hub content types that can be added to a SharePoint list.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the content types published in the Content Type Hub that can be added to one list, one page at a time. Pass a returned ID to Add Hub Content Type to List; use List Compatible Hub Content Types for a site.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<ContentType>({
      auth,
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/contentTypes/getCompatibleHubContentTypes`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});

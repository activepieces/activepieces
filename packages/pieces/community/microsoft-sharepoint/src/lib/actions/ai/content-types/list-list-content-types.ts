import { createAction } from '@activepieces/pieces-framework';
import type { ContentType } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListListContentTypesOutputSchema } from '../../../output-schemas';

export const listListContentTypesAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_list_content_types',
  outputSchema: microsoftSharepointListListContentTypesOutputSchema,
  displayName: 'List List Content Types',
  description: 'Lists the content types attached to a SharePoint list.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the content types attached to one SharePoint list or document library, with their IDs, names and groups, one page at a time. Use List Content Types for the content types of the whole site.',
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
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/contentTypes`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});

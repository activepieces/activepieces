import { createAction } from '@activepieces/pieces-framework';
import type { ContentType } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListApplicableContentTypesOutputSchema } from '../../../output-schemas';

export const listApplicableContentTypesAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_applicable_content_types',
  outputSchema: microsoftSharepointListApplicableContentTypesOutputSchema,
  displayName: 'List Applicable Content Types',
  description: 'Lists the site content types that can be added to a SharePoint list.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the site content types that can be added to one list, one page at a time. Pass a returned ID to Add Content Type to List; List Lists returns the list IDs.',
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
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/getApplicableContentTypesForList(listId='${encodeURIComponent(propsValue.listId)}')`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});

import { createAction } from '@activepieces/pieces-framework';
import type { ItemActivity } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListListActivitiesOutputSchema } from '../../../output-schemas';

export const listListActivitiesAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_list_activities',
  outputSchema: microsoftSharepointListListActivitiesOutputSchema,
  displayName: 'List List Activities',
  description: 'Lists recent activities in a SharePoint list.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the recent activities (views, edits, deletes and more, with who and when) across a whole SharePoint list, one page at a time. Use List List Item Activities for one item; List Lists returns the list ID.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<ItemActivity>({
      auth,
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/activities`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});

import { createAction } from '@activepieces/pieces-framework';
import type { ItemActivity } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListListActivitiesOutputSchema } from '../../../output-schemas';

export const listListItemActivitiesAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_list_item_activities',
  outputSchema: microsoftSharepointListListActivitiesOutputSchema,
  displayName: 'List List Item Activities',
  description: 'Lists recent activities on an item in a SharePoint list.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the recent activities (views, edits, deletes and more, with who and when) on one SharePoint list item, one page at a time. Use List List Activities for the whole list; List List Items returns the item ID.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    listId: microsoftSharePointAiProps.listId({ required: true }),
    listItemId: microsoftSharePointAiProps.listItemId({ required: true }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<ItemActivity>({
      auth,
      path: `/sites/${encodeURIComponent(propsValue.siteId)}/lists/${encodeURIComponent(propsValue.listId)}/items/${encodeURIComponent(propsValue.listItemId)}/activities`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});

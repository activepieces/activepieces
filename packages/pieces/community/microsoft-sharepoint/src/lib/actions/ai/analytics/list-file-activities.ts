import { createAction } from '@activepieces/pieces-framework';
import type { ItemActivity } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListFileActivitiesOutputSchema } from '../../../output-schemas';

export const listFileActivitiesAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_file_activities',
  outputSchema: microsoftSharepointListFileActivitiesOutputSchema,
  displayName: 'List File Activities',
  description: 'Lists recent activities on a file or folder in a SharePoint document library.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the recent activities (views, edits, deletes and more, with who and when) on one file or folder and the items under it, one page at a time. Use List Drive Activities for the whole library; List Folder Children, Find File or Search return the item ID.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<ItemActivity>({
      auth,
      path: `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/activities`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});

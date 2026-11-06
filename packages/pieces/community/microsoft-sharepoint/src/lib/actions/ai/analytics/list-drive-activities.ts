import { createAction } from '@activepieces/pieces-framework';
import type { ItemActivity } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListDriveActivitiesOutputSchema } from '../../../output-schemas';

export const listDriveActivitiesAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_drive_activities',
  outputSchema: microsoftSharepointListDriveActivitiesOutputSchema,
  displayName: 'List Drive Activities',
  description: 'Lists recent activities in a SharePoint document library.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the recent activities (views, edits, deletes and more, with who and when) across a whole document library, one page at a time. Use List File Activities for one file or folder; List Site Drives or Get Site Default Drive returns the drive ID.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<ItemActivity>({
      auth,
      path: `/drives/${encodeURIComponent(propsValue.driveId)}/activities`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});

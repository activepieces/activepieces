import { createAction } from '@activepieces/pieces-framework';
import type { DriveItem } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointFollowDriveItemOutputSchema } from '../../../output-schemas';

export const followDriveItemAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_follow_drive_item',
  outputSchema: microsoftSharepointFollowDriveItemOutputSchema,
  displayName: 'Follow Drive Item',
  description: 'Follows a file or folder for the signed-in user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Adds a file or folder to the signed-in user's followed items, shown by List Followed Files. Needs the user's OneDrive to be provisioned; Unfollow Drive Item reverses it.",
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const item: DriveItem = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/follow`
      )
      .post(undefined);
    return item;
  },
});

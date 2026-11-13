import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointUnfollowDriveItemOutputSchema } from '../../../output-schemas';

export const unfollowDriveItemAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_unfollow_drive_item',
  outputSchema: microsoftSharepointUnfollowDriveItemOutputSchema,
  displayName: 'Unfollow Drive Item',
  description: 'Stops following a file or folder for the signed-in user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Removes a file or folder from the signed-in user's followed items. Needs the user's OneDrive to be provisioned; List Followed Files returns the IDs to pass.",
    idempotent: true,
  },
  props: {
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'ID of the followed file or folder. Use List Followed Files to find it.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    await microsoftSharePointClient
      .create({ auth })
      .api(`/me/drive/items/${encodeURIComponent(propsValue.itemId)}/unfollow`)
      .post(undefined);
    return { success: true };
  },
});

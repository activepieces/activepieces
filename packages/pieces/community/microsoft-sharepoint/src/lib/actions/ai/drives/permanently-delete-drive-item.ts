import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointCheckInFileOutputSchema } from '../../../output-schemas';

export const permanentlyDeleteDriveItemAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_permanently_delete_drive_item',
  outputSchema: microsoftSharepointCheckInFileOutputSchema,
  displayName: 'Permanently Delete Drive Item',
  description: 'Permanently deletes a file or folder, skipping the recycle bin.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a file or folder and everything inside it without moving it to the recycle bin, so it cannot be restored. Prefer Delete Drive Item, which keeps the item restorable. List Folder Children, Find File and Search return item IDs.',
    idempotent: false,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await microsoftSharePointClient
      .create({ auth })
      .api(
        `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/permanentDelete`
      )
      .post(undefined);
    return { success: true };
  },
});

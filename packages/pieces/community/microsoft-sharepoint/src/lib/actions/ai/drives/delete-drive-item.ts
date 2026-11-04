import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointCheckInFileOutputSchema } from '../../../output-schemas';

export const deleteDriveItemAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_delete_drive_item',
  outputSchema: microsoftSharepointCheckInFileOutputSchema,
  displayName: 'Delete Drive Item',
  description: 'Moves a file or folder to the site recycle bin.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes a file or folder by moving it to the site recycle bin, where it can still be restored; deleting a folder also deletes everything inside it. Use Permanently Delete Drive Item to skip the recycle bin. List Folder Children, Find File and Search return item IDs.',
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
        `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}`
      )
      .delete();
    return { success: true };
  },
});

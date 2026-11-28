import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxRemoveFolderWatermarkOutputSchema } from '../../../output-schemas';

export const removeFolderWatermarkAction = createAction({
  auth: boxAuth,
  name: 'box_remove_folder_watermark',
  outputSchema: boxRemoveFolderWatermarkOutputSchema,
  displayName: 'Remove Folder Watermark',
  description: 'Removes the watermark from a Box folder.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes the watermark from a folder; Apply Folder Watermark can put it back. Fails with 404 when the folder has no watermark. Get the folder ID from List Folder Items or Search.',
    idempotent: false,
  },
  props: {
    folderId: boxAiProps.folderId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/folders/${encodeURIComponent(propsValue.folderId)}/watermark`,
    });
    return { removed: true, folderId: propsValue.folderId };
  },
});

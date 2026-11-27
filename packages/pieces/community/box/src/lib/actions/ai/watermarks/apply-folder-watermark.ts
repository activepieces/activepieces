import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const applyFolderWatermarkAction = createAction({
  auth: boxAuth,
  name: 'box_apply_folder_watermark',
  displayName: 'Apply Folder Watermark',
  description: 'Applies the default watermark to a Box folder.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Applies the default Box watermark to a folder and every file in it, or keeps it if one is already there. Remove it with Remove Folder Watermark. Needs a Business Plus or Enterprise plan. Get the folder ID from List Folder Items or Search.',
    idempotent: true,
  },
  props: {
    folderId: boxAiProps.folderId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/folders/${encodeURIComponent(propsValue.folderId)}/watermark`,
      body: { watermark: { imprint: 'default' } },
    });
  },
});

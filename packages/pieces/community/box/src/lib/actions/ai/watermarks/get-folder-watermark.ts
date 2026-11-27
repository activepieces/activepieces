import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getFolderWatermarkAction = createAction({
  auth: boxAuth,
  name: 'box_get_folder_watermark',
  displayName: 'Get Folder Watermark',
  description: 'Gets the watermark on a Box folder.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns when the watermark on a folder was created and last changed. Fails with 404 when the folder has no watermark. Needs a Business Plus or Enterprise plan. Get the folder ID from List Folder Items or Search.',
    idempotent: true,
  },
  props: {
    folderId: boxAiProps.folderId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/folders/${encodeURIComponent(propsValue.folderId)}/watermark`,
    });
  },
});

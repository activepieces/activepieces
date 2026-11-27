import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const applyFileWatermarkAction = createAction({
  auth: boxAuth,
  name: 'box_apply_file_watermark',
  displayName: 'Apply File Watermark',
  description: 'Applies the default watermark to a Box file.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Applies the default Box watermark to a file, or keeps it if one is already there. Remove it with Remove File Watermark. Needs a Business Plus or Enterprise plan. Get the file ID from List Folder Items or Search.',
    idempotent: true,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/watermark`,
      body: { watermark: { imprint: 'default' } },
    });
  },
});

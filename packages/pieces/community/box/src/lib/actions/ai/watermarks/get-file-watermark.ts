import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxApplyFileWatermarkOutputSchema } from '../../../output-schemas';

export const getFileWatermarkAction = createAction({
  auth: boxAuth,
  name: 'box_get_file_watermark',
  outputSchema: boxApplyFileWatermarkOutputSchema,
  displayName: 'Get File Watermark',
  description: 'Gets the watermark on a Box file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns when the watermark on a file was created and last changed. Fails with 404 when the file has no watermark. Needs a Business Plus or Enterprise plan. Get the file ID from List Folder Items or Search.',
    idempotent: true,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/watermark`,
    });
  },
});

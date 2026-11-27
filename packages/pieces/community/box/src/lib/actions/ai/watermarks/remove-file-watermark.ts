import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const removeFileWatermarkAction = createAction({
  auth: boxAuth,
  name: 'box_remove_file_watermark',
  displayName: 'Remove File Watermark',
  description: 'Removes the watermark from a Box file.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes the watermark from a file; Apply File Watermark can put it back. Fails with 404 when the file has no watermark. Get the file ID from List Folder Items or Search.',
    idempotent: false,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/watermark`,
    });
    return { removed: true, fileId: propsValue.fileId };
  },
});

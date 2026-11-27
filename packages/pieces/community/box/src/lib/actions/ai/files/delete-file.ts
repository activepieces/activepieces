import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxDeleteFileOutputSchema } from '../../../output-schemas';

export const deleteFileAction = createAction({
  auth: boxAuth,
  name: 'box_delete_file',
  outputSchema: boxDeleteFileOutputSchema,
  displayName: 'Delete File',
  description: 'Moves a Box file to the trash.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Moves a Box file to the trash, where Restore File can bring it back until the trash is emptied; use Delete File Permanently on a trashed file to remove it for good. Get the ID from List Folder Items or Search.',
    idempotent: false,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    etag: boxAiProps.etag({ required: false }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/files/${encodeURIComponent(propsValue.fileId)}`,
      headers: propsValue.etag ? { 'if-match': propsValue.etag } : undefined,
    });
    return { trashed: true, fileId: propsValue.fileId };
  },
});

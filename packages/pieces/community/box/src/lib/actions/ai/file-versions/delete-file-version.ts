import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxDeleteFileVersionOutputSchema } from '../../../output-schemas';

export const deleteFileVersionAction = createAction({
  auth: boxAuth,
  name: 'box_delete_file_version',
  outputSchema: boxDeleteFileVersionOutputSchema,
  displayName: 'Delete File Version',
  description: 'Moves a past version of a Box file to the trash.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Moves one past version of a file to the trash; Restore File Version brings it back until the trash is emptied. The file and its other versions stay. Get the version ID from List File Versions.',
    idempotent: false,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    fileVersionId: boxAiProps.fileVersionId({
      required: true,
      description: 'ID of the version to trash. Get it from List File Versions.',
    }),
    etag: boxAiProps.etag({ required: false }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/versions/${encodeURIComponent(propsValue.fileVersionId)}`,
      headers: propsValue.etag ? { 'if-match': propsValue.etag } : undefined,
    });
    return { trashed: true, fileId: propsValue.fileId, fileVersionId: propsValue.fileVersionId };
  },
});

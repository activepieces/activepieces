import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const restoreFileVersionAction = createAction({
  auth: boxAuth,
  name: 'box_restore_file_version',
  displayName: 'Restore File Version',
  description: 'Restores a trashed version of a Box file.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Takes a version trashed with Delete File Version out of the trash, back into the version history; it does not make it current (use Promote File Version for that). Get the version ID from List File Versions.',
    idempotent: true,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    fileVersionId: boxAiProps.fileVersionId({
      required: true,
      description: 'ID of the trashed version. Get it from List File Versions.',
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/versions/${encodeURIComponent(propsValue.fileVersionId)}`,
      body: { trashed_at: null },
    });
  },
});

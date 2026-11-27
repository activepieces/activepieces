import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteFilePermanentlyAction = createAction({
  auth: boxAuth,
  name: 'box_delete_file_permanently',
  displayName: 'Delete File Permanently',
  description: 'Permanently deletes a Box file that is in the trash.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently removes a file from the trash; it cannot be restored afterwards. Works only on a trashed file, so trash it first with Delete File. Get the ID from List Trashed Items.',
    idempotent: false,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true, description: 'ID of the trashed file. Get it from List Trashed Items.' }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/trash`,
    });
    return { deleted: true, fileId: propsValue.fileId };
  },
});

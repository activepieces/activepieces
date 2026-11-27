import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteFolderPermanentlyAction = createAction({
  auth: boxAuth,
  name: 'box_delete_folder_permanently',
  displayName: 'Delete Folder Permanently',
  description: 'Permanently deletes a Box folder that is in the trash.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently removes a trashed folder and everything in it; it cannot be restored afterwards. Works only on a trashed folder, so trash it first with Delete Folder. Get the ID from List Trashed Items.',
    idempotent: false,
  },
  props: {
    folderId: boxAiProps.folderId({ required: true, description: 'ID of the trashed folder. Get it from List Trashed Items.' }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/folders/${encodeURIComponent(propsValue.folderId)}/trash`,
    });
    return { deleted: true, folderId: propsValue.folderId };
  },
});

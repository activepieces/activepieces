import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const listFolderLocksAction = createAction({
  auth: boxAuth,
  name: 'box_list_folder_locks',
  displayName: 'List Folder Locks',
  description: 'Lists the locks on a Box folder.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the locks on one folder, with each lock\'s ID and the operations (move, delete) it blocks; an empty list means the folder is unlocked. Only the folder\'s owner or co-owner can call it. Get the folder ID from List Folder Items or Search.',
    idempotent: true,
  },
  props: {
    folderId: boxAiProps.folderId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/folder_locks',
      query: { folder_id: propsValue.folderId },
    });
  },
});

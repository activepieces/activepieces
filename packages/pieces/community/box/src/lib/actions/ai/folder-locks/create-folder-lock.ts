import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxCreateFolderLockOutputSchema } from '../../../output-schemas';

export const createFolderLockAction = createAction({
  auth: boxAuth,
  name: 'box_create_folder_lock',
  outputSchema: boxCreateFolderLockOutputSchema,
  displayName: 'Create Folder Lock',
  description: 'Locks a Box folder so it cannot be moved or deleted.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Locks a folder against both moving and deleting and returns the lock with its ID; Delete Folder Lock removes it. Only the folder\'s owner or co-owner can lock it. Get the folder ID from List Folder Items or Search.',
    idempotent: false,
  },
  props: {
    folderId: boxAiProps.folderId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/folder_locks',
      body: { folder: { type: 'folder', id: propsValue.folderId } },
    });
  },
});

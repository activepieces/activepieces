import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxClient } from '../../../common/client';

export const deleteFolderLockAction = createAction({
  auth: boxAuth,
  name: 'box_delete_folder_lock',
  displayName: 'Delete Folder Lock',
  description: 'Removes a lock from a Box folder.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes a folder lock so the folder can be moved and deleted again; Create Folder Lock can lock it again. Only the folder\'s owner or co-owner can call it. Get the lock ID from List Folder Locks or Create Folder Lock.',
    idempotent: false,
  },
  props: {
    folderLockId: Property.ShortText({
      displayName: 'Folder Lock ID',
      description: 'The lock\'s ID, from List Folder Locks or Create Folder Lock.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/folder_locks/${encodeURIComponent(propsValue.folderLockId)}`,
    });
    return { deleted: true, folderLockId: propsValue.folderLockId };
  },
});

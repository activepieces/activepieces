import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const restoreFolderAction = createAction({
  auth: boxAuth,
  name: 'box_restore_folder',
  displayName: 'Restore Folder',
  description: 'Restores a Box folder from the trash.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Moves a trashed folder and its contents back to its original location and returns it. Parent Folder ID is used only when the original parent no longer exists; a name clash there fails with 409 unless a new Name is given. Get the ID from List Trashed Items or the Delete Folder result.',
    idempotent: false,
  },
  props: {
    folderId: boxAiProps.folderId({ required: true, description: 'ID of the trashed folder. Get it from List Trashed Items.' }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New name for the restored folder, to avoid a name clash.',
      required: false,
    }),
    parentFolderId: boxAiProps.folderId({
      required: false,
      displayName: 'Parent Folder ID',
      description: 'Folder to restore into if the original parent no longer exists.',
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: `/folders/${encodeURIComponent(propsValue.folderId)}`,
      query: { fields: propsValue.fields },
      body: {
        ...(propsValue.name !== undefined ? { name: propsValue.name } : {}),
        ...(propsValue.parentFolderId !== undefined ? { parent: { id: propsValue.parentFolderId } } : {}),
      },
    });
  },
});

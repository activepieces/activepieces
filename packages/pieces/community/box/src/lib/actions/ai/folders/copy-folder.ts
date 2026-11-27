import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const copyFolderAction = createAction({
  auth: boxAuth,
  name: 'box_copy_folder',
  displayName: 'Copy Folder',
  description: 'Copies a Box folder and its contents into another folder.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Copies a folder with all its contents into a destination folder and returns the new copy with its ID; the original is unchanged. The root folder "0" cannot be copied, and a name already used in the destination fails with 409. Get IDs from List Folder Items, Search or Create Folder.',
    idempotent: false,
  },
  props: {
    folderId: boxAiProps.folderId({ required: true, description: 'ID of the folder to copy. Get it from List Folder Items or Search.' }),
    parentFolderId: boxAiProps.folderId({
      required: true,
      displayName: 'Destination Folder ID',
      description: 'ID of the folder to copy into. "0" is the root "All Files" folder.',
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name for the copy. Defaults to the original name.',
      required: false,
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: `/folders/${encodeURIComponent(propsValue.folderId)}/copy`,
      query: { fields: propsValue.fields },
      body: {
        parent: { id: propsValue.parentFolderId },
        ...(propsValue.name !== undefined ? { name: propsValue.name } : {}),
      },
    });
  },
});

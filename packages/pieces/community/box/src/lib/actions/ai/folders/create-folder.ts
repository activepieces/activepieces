import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const createFolderAction = createAction({
  auth: boxAuth,
  name: 'box_create_folder',
  displayName: 'Create Folder',
  description: 'Creates a folder in Box.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new folder inside a parent folder and returns it with its new ID. Fails with 409 if the parent already has an item with that name; List Folder Items shows what exists.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Name of the new folder.', required: true }),
    parentFolderId: boxAiProps.folderId({
      required: true,
      displayName: 'Parent Folder ID',
      description: 'ID of the folder to create it in. "0" is the root "All Files" folder.',
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/folders',
      query: { fields: propsValue.fields },
      body: { name: propsValue.name, parent: { id: propsValue.parentFolderId } },
    });
  },
});

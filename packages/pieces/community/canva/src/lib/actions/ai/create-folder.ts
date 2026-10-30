import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../common';
import { canvaOutputSchemas } from '../../common/output-schemas';
import { createFolderRequest } from '../create-folder';

export const canvaCreateFolderAi = createAction({
  auth: canvaAuth,
  name: 'canva_create_folder',
  displayName: 'Create Folder',
  description: 'Creates a Canva folder.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: canvaOutputSchemas.folderResult,
  aiMetadata: {
    description:
      'Creates a folder and returns its ID. parentFolderId is "root" for the top level of Projects, "uploads" for the Uploads folder, or another folder ID. Canva allows duplicate names, so each call creates another folder; check canva_list_folder_items first to reuse an existing one.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Folder name, 1-255 characters.', required: true }),
    parentFolderId: Property.ShortText({ displayName: 'Parent Folder ID', description: 'root, uploads, or a folder ID.', required: true }),
  },
  async run(context) {
    return createFolderRequest({ token: context.auth.access_token, name: context.propsValue.name, parentFolderId: context.propsValue.parentFolderId });
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth, canvaProps, FolderResponse } from '../common';
import { canvaClient } from '../common/client';
import { canvaOutputSchemas } from '../common/output-schemas';

export const createFolder = createAction({
  auth: canvaAuth,
  name: 'create_folder',
  classification: 'WRITE',
  displayName: 'Create Folder',
  description: 'Create a folder in your Canva projects, in Uploads, or inside another folder.',
  audience: 'human',
  aiMetadata: {
    description: 'Creates a Canva folder. Human step; agents use canva_create_folder. Not idempotent: each run creates another folder, even with the same name.',
    idempotent: false,
  },
  outputSchema: canvaOutputSchemas.folderResult,
  props: {
    name: Property.ShortText({
      displayName: 'Folder Name',
      description: 'Name of the new folder (1-255 characters).',
      required: true,
    }),
    parentFolderId: canvaProps.folderDropdown({ displayName: 'Parent Folder', description: 'Where to create the folder.' }),
  },
  async run(context) {
    return createFolderRequest({
      token: context.auth.access_token,
      name: context.propsValue.name,
      parentFolderId: context.propsValue.parentFolderId,
    });
  },
});

async function create({ token, name, parentFolderId }: { token: string; name: string; parentFolderId: string }) {
  const trimmedName = name.trim();
  const parent = parentFolderId.trim();
  if (!trimmedName || trimmedName.length > 255) {
    throw new Error('Folder name must be 1-255 characters.');
  }
  if (!parent || parent.length > 50) {
    throw new Error('Parent folder ID must be 1-50 characters. Use "root" for the top level or "uploads" for Uploads.');
  }
  const body = await canvaClient.request<FolderResponse>({
    token,
    method: HttpMethod.POST,
    path: '/folders',
    body: { name: trimmedName, parent_folder_id: parent },
  });
  return { folder: body.folder };
}

export const createFolderRequest = create;

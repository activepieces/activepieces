import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth, canvaProps, FolderResponse } from '../common';
import { canvaClient } from '../common/client';
import { canvaOutputSchemas } from '../common/output-schemas';

export const getFolder = createAction({
  auth: canvaAuth,
  name: 'get_folder',
  classification: 'READ',
  displayName: 'Get Folder',
  description: 'Get the details of a folder, including name, dates and thumbnail.',
  audience: 'human',
  aiMetadata: {
    description: 'Gets one Canva folder by ID. Human step; agents use canva_list_folder_items. Read-only.',
    idempotent: true,
  },
  outputSchema: canvaOutputSchemas.getFolder,
  props: {
    folder_id: canvaProps.folderDropdown({ displayName: 'Folder', description: 'The folder to look up.' }),
  },
  async run(context) {
    const folderId = context.propsValue.folder_id.trim();
    if (!folderId) {
      throw new Error('Folder is required.');
    }
    const { folder } = await canvaClient.request<FolderResponse>({
      token: context.auth.access_token,
      method: HttpMethod.GET,
      path: `/folders/${encodeURIComponent(folderId)}`,
    });
    return {
      folder: {
        id: folder.id,
        name: folder.name,
        created_at: folder.created_at,
        updated_at: folder.updated_at,
        thumbnail: folder.thumbnail ?? null,
      },
      folder_id: folder.id,
      folder_name: folder.name,
      created_date: new Date(folder.created_at * 1000).toISOString(),
      updated_date: new Date(folder.updated_at * 1000).toISOString(),
      has_thumbnail: Boolean(folder.thumbnail),
      thumbnail_url: folder.thumbnail?.url ?? null,
    };
  },
});

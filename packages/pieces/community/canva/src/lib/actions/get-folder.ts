import {
  Property,
  createAction,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaCommon, FolderResponse, fetchUserFolders } from '../common';

export const getFolder = createAction({
  auth: canvaAuth,
  name: 'get_folder',
  displayName: 'Get Folder',
  description: 'Retrieve metadata for a specific folder, including name, creation date, and thumbnail.',
  props: {
    folder_id: Property.Dropdown({
      displayName: 'Folder',
      description: 'Select the folder to retrieve metadata for',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate with Canva first',
            options: [],
          };
        }
        
        try {
          const folders = await fetchUserFolders(auth);
          return {
            disabled: false,
            options: folders,
          };
        } catch (error) {
          console.error('Error fetching folders:', error);
          return {
            disabled: true,
            placeholder: 'Error loading folders',
            options: [],
          };
        }
      },
    }),
  },
  async run(context) {
    const { folder_id } = context.propsValue;
    const authValue = context.auth as OAuth2PropertyValue;

    if (!folder_id || !folder_id.trim()) {
      throw new Error('Folder ID is required');
    }

    const cleanFolderId = folder_id.trim();

    try {
      const response = await fetch(`${canvaCommon.baseUrl}/folders/${cleanFolderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authValue.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 400) {
          throw new Error(`Bad Request: ${errorData.message || 'Invalid folder ID format'}`);
        }
        
        if (response.status === 401) {
          throw new Error('Unauthorized: Please check your authentication credentials');
        }
        
        if (response.status === 403) {
          throw new Error('Forbidden: You do not have permission to access this folder');
        }
        
        if (response.status === 404) {
          throw new Error(`Folder not found: The folder with ID "${cleanFolderId}" does not exist or you do not have access to it`);
        }
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded: Too many requests (limit: 100 per minute)');
        }
        
        throw new Error(`HTTP ${response.status}: ${errorData.message || 'Request failed'}`);
      }

      const data: FolderResponse = await response.json();
      const folder = data.folder;

      return {
        folder: {
          id: folder.id,
          name: folder.name,
          created_at: folder.created_at,
          updated_at: folder.updated_at,
          thumbnail: folder.thumbnail || null,
        },
        folder_id: folder.id,
        folder_name: folder.name,
        created_date: new Date(folder.created_at * 1000).toISOString(),
        updated_date: new Date(folder.updated_at * 1000).toISOString(),
        has_thumbnail: !!folder.thumbnail,
        thumbnail_url: folder.thumbnail?.url || null,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to get folder: ${String(error)}`);
    }
  },
}); 
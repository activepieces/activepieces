import { PieceAuth, Property, Validators } from '@activepieces/pieces-framework';
import { httpClient } from '@activepieces/pieces-common';

/**
 * pCloud OAuth2 Authentication
 * Uses access token from pCloud OAuth2 flow
 */
export const pcloudAuth = PieceAuth.SecretText({
  description: 'Access Token from pCloud OAuth2 (Create app at https://docs.pcloud.com/my_apps/)',
  required: true,
  displayName: 'Access Token',
  validators: [Validators.pattern(/\w+/)],
});

/**
 * pCloud API Base URLs
 * US: api.pcloud.com
 * EU: eapi.pcloud.com
 * The correct endpoint is determined during OAuth flow
 */
export const API_BASE_URL = 'https://api.pcloud.com';

/**
 * Folder ID Dropdown with dynamic loading
 */
export const folderId = Property.Dropdown<'text' | 'number'>({
  displayName: 'Folder',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Enter access token' };
    }

    try {
      const response = await httpClient.sendRequest<{
        metadata: { folderid: number; name: string; path: string; isfolder: boolean }[];
      }>({
        method: 'GET',
        url: `${API_BASE_URL}/listfolder`,
        headers: {},
        queryParams: {
          access_token: auth as string,
          folderid: '0', // Root folder
        },
      });

      const folders = response.body.metadata.filter((m) => m.isfolder);

      return {
        options: [
          { label: '/ (Root)', value: '0' },
          ...folders.map((f) => ({
            label: f.path || `/${f.name}`,
            value: String(f.folderid),
          })),
        ],
      };
    } catch (error) {
      return { disabled: true, options: [], placeholder: 'Error loading folders' };
    }
  },
});

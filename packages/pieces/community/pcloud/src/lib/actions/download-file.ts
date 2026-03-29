import {
  createAction,
  PieceAuth,
  PieceProperty,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient } from '@activepieces/pieces-common';
import { pcloudAuth, API_BASE_URL } from '../auth';

/**
 * File ID property for pCloud
 */
export const fileId = Property.Dropdown<'text' | 'number'>({
  displayName: 'File',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Enter access token' };
    }

    try {
      const response = await httpClient.sendRequest<{
        metadata: { fileid: number; name: string; path: string; isfolder: boolean }[];
      }>({
        method: 'GET',
        url: `${API_BASE_URL}/listfolder`,
        queryParams: {
          access_token: auth as string,
          folderid: '0',
        },
      });

      const files = response.body.metadata.filter((m) => !m.isfolder);

      return {
        options: files.map((f) => ({
          label: f.path || `/${f.name}`,
          value: String(f.fileid),
        })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Error loading files' };
    }
  },
});

/**
 * Download File Action
 * Gets a download link for a file
 */
export const downloadFile = createAction({
  auth: pcloudAuth,
  displayName: 'Get Download Link',
  description: 'Get a download link for a file in pCloud',
  props: {
    file_id: fileId,
    force_download: Property.Checkbox({
      displayName: 'Force Download',
      description: 'Force the file to download instead of displaying in browser',
      required: false,
    }),
  },
  async run(context) {
    const { file_id, force_download } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: 'GET',
      url: `${API_BASE_URL}/getfilelink`,
      queryParams: {
        access_token: context.auth,
        fileid: file_id,
        ...(force_download ? { forcedownload: '1' } : {}),
      },
    });

    return response.body;
  },
});

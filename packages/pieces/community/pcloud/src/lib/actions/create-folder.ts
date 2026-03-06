import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pCloudAuth, getPCloudBaseUrl } from '../auth';
import { PCloudCreateFolderResponse, pCloudFolderIdProp } from '../common';

export const createFolder = createAction({
  auth: pCloudAuth,
  name: 'create_folder',
  displayName: 'Create Folder',
  description: 'Create a new folder in pCloud.',
  props: {
    parent_folder_id: pCloudFolderIdProp,
    folder_name: Property.ShortText({
      displayName: 'Folder Name',
      description: 'Name of the new folder to create.',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth;
    const baseUrl = getPCloudBaseUrl(auth as unknown as { data?: Record<string, unknown> });
    const parentFolderId = context.propsValue.parent_folder_id ?? '0';
    const folderName = context.propsValue.folder_name;

    const response = await httpClient.sendRequest<PCloudCreateFolderResponse>({
      method: HttpMethod.GET,
      url: `${baseUrl}/createfolder`,
      queryParams: {
        folderid: String(parentFolderId),
        name: folderName,
      },
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
    });

    if (response.body.result !== 0) {
      throw new Error(
        `pCloud API error ${response.body.result}: Failed to create folder "${folderName}".`
      );
    }

    return response.body.metadata;
  },
});

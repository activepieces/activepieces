import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient } from '@activepieces/pieces-common';
import { pcloudAuth, folderId, API_BASE_URL } from '../auth';

/**
 * List Folder Action
 * Lists all files and folders in a pCloud folder
 */
export const listFolder = createAction({
  auth: pcloudAuth,
  displayName: 'List Folder',
  description: 'List all files and folders in a pCloud folder',
  props: {
    folder_id: folderId,
    include_deleted: Property.Checkbox({
      displayName: 'Include Deleted',
      description: 'Include deleted items in the result',
      required: false,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest<any>({
      method: 'GET',
      url: `${API_BASE_URL}/listfolder`,
      queryParams: {
        access_token: context.auth as string,
        folderid: context.propsValue.folder_id,
      },
    });

    if (context.propsValue.include_deleted) {
      return response.body;
    }

    // Filter out deleted items from contents
    if (response.body.metadata?.contents) {
      response.body.metadata.contents = response.body.metadata.contents.filter((item: any) => !item.isdeleted);
    }

    return response.body;
  },
});

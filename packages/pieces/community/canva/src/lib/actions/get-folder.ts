import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { CanvaFolder } from '../common/types';

export const getFolderAction = createAction({
  auth: canvaAuth,
  name: 'get_folder',
  displayName: 'Get Folder',
  description: 'Get details of a specific folder',
  props: {
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'The ID of the folder to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const { folderId } = context.propsValue;

    const response = await canvaApiCall<{ folder: CanvaFolder }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/folders/${folderId}`,
    });

    return response.folder;
  },
});

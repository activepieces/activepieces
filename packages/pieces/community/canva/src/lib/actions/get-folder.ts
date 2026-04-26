import { createAction } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';
import { canvaApiRequest, canvaCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const getFolder = createAction({
  auth: canvaAuth,
  name: 'get_folder',
  displayName: 'Get a Folder',
  description: 'Retrieve details about a specific Canva folder by its ID. Use "root" as the folder ID to get the root folder.',
  props: {
    folderId: canvaCommon.folderId,
  },
  async run(context) {
    const { folderId } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const response = await canvaApiRequest({
      auth,
      method: HttpMethod.GET,
      path: `/folders/${folderId}`,
    });

    return response;
  },
});

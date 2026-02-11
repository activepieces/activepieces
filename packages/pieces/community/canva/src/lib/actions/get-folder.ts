import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow, HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../';
import { callCanvaApi } from '../common';

export const getFolder = createAction({
  auth: canvaAuth,
  name: 'get_folder',
  displayName: 'Get Folder',
  description: 'Retrieve details about an existing folder by its ID.',
  props: {
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description: 'The ID of the folder to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const { folder_id } = context.propsValue;
    const accessToken = getAccessTokenOrThrow(context.auth);

    const response = await callCanvaApi(
      HttpMethod.GET,
      `folders/${folder_id}`,
      accessToken
    );
    return response.body;
  },
});

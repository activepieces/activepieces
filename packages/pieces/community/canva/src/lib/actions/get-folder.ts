import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';
import { canvaApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const canvaGetFolder = createAction({
  auth: canvaAuth,
  name: 'get_folder',
  displayName: 'Get Folder',
  description: 'Retrieve details about a Canva folder.',
  props: {
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description: 'The ID of the folder to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const { folder_id } = context.propsValue;
    const accessToken = context.auth.access_token;

    const result = await canvaApiCall<{ folder: unknown }>({
      accessToken,
      method: HttpMethod.GET,
      resourceUrl: `/folders/${folder_id}`,
    });

    return result;
  },
});

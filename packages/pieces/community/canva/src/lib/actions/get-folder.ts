import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../';

export const canvaGetFolder = createAction({
  auth: canvaAuth,
  name: 'get_canva_folder',
  description: 'Retrieve details about an existing folder in Canva',
  displayName: 'Get a Folder',
  props: {
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description: 'The ID of the folder to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.canva.com/rest/v1/folders/${context.propsValue.folder_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../../';

export const dropboxCreateNewFolder = createAction({
  auth: dropboxAuth,
  name: 'create_new_dropbox_folder',
  description: 'Create a new empty folder',
  displayName: 'Create New Folder',
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description: 'The path of the new folder e.g. /Homework/math',
      required: true,
    }),
    autorename: Property.Checkbox({
      displayName: 'Auto Rename',
      description:
        "If there's a conflict, have the Dropbox server try to autorename the folder to avoid the conflict. The default for this field is False.",
      required: false,
    }),
  },
  async run(context) {
    const body = {
      autorename: context.propsValue.autorename ? true : false,
      path: context.propsValue.path,
    };

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.dropboxapi.com/2/files/create_folder_v2`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    };

    const result = await httpClient.sendRequest(request);
    console.debug('Folder creation response', result);

    if (result.status == 200) {
      return result.body;
    } else {
      return result;
    }
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../../';

export const dropboxMoveFolder = createAction({
  auth: dropboxAuth,
  name: 'move_dropbox_folder',
  description: 'Move a folder',
  displayName: 'Move folder',
  props: {
    from_path: Property.ShortText({
      displayName: 'From Path',
      description:
        'The current path of the folder (e.g. /folder1/sourceFolder)',
      required: true,
    }),
    to_path: Property.ShortText({
      displayName: 'To Path',
      description:
        'The new path for the folder (e.g. /folder2/destinationFolder)',
      required: true,
    }),
    autorename: Property.Checkbox({
      displayName: 'Auto Rename',
      description:
        "If there's a conflict, have the Dropbox server try to autorename the folder to avoid conflict.",
      defaultValue: false,
      required: false,
    }),
    allow_ownership_transfer: Property.Checkbox({
      displayName: 'Allow Ownership Transfer',
      description:
        'Allows moves by owner even if it would result in an ownership transfer.',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const params = {
      from_path: context.propsValue.from_path,
      to_path: context.propsValue.to_path,
      autorename: context.propsValue.autorename,
      allow_ownership_transfer: context.propsValue.allow_ownership_transfer,
    };

    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.dropboxapi.com/2/files/move_v2`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: params,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});

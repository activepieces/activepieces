import { createAction, Property } from '@ensemble/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@ensemble/pieces-common';
import { dropboxAuth } from '../../';

export const dropboxCopyFile = createAction({
  auth: dropboxAuth,
  name: 'copy_dropbox_file',
  description: 'Copy a file',
  displayName: 'Copy file',
  props: {
    from_path: Property.ShortText({
      displayName: 'From Path',
      description: 'The source path of the file (e.g. /folder1/sourcefile.txt)',
      required: true,
    }),
    to_path: Property.ShortText({
      displayName: 'To Path',
      description:
        'The destination path for the copied (e.g. /folder2/destinationfile.txt)',
      required: true,
    }),
    autorename: Property.Checkbox({
      displayName: 'Auto Rename',
      description:
        "If there's a conflict, have the Dropbox server try to autorename the file to avoid conflict.",
      defaultValue: false,
      required: false,
    }),
    allow_ownership_transfer: Property.Checkbox({
      displayName: 'Allow Ownership Transfer',
      description:
        'Allows copy by owner even if it would result in an ownership transfer.',
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
      url: `https://api.dropboxapi.com/2/files/copy_v2`,
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

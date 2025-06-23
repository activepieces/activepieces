import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../../';

export const dropboxUploadFile = createAction({
  auth: dropboxAuth,
  name: 'upload_dropbox_file',
  description: 'Upload a file',
  displayName: 'Upload file',
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description:
        'The path where the file should be saved (e.g. /folder1/file.txt)',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file URL or base64 to upload',
      required: true,
    }),
    autorename: Property.Checkbox({
      displayName: 'Auto Rename',
      description:
        "If there's a conflict, as determined by mode, have the Dropbox server try to autorename the file to avoid conflict.",
      defaultValue: false,
      required: false,
    }),
    mute: Property.Checkbox({
      displayName: 'Mute',
      description:
        "Normally, users are made aware of any file modifications in their Dropbox account via notifications in the client software. If true, this tells the clients that this modification shouldn't result in a user notification.",
      required: false,
    }),
    strict_conflict: Property.Checkbox({
      displayName: 'Strict conflict',
      description:
        'Be more strict about how each WriteMode detects conflict. For example, always return a conflict error when mode = WriteMode.update and the given "rev" doesn\'t match the existing file\'s "rev", even if the existing file has been deleted.',
      required: false,
    }),
  },
  async run(context) {
    const fileData = context.propsValue.file;

    const params = {
      autorename: context.propsValue.autorename,
      path: context.propsValue.path,
      mode: 'add',
      mute: context.propsValue.mute,
      strict_conflict: context.propsValue.strict_conflict,
    };

    const fileBuffer = Buffer.from(fileData.base64, 'base64');
    // For information about Dropbox JSON encoding, see https://www.dropbox.com/developers/reference/json-encoding
    const dropboxApiArg = JSON.stringify(params).replace(/[\u007f-\uffff]/g, (c) => '\\u'+('000'+c.charCodeAt(0).toString(16)).slice(-4));

    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://content.dropboxapi.com/2/files/upload`,
      body: fileBuffer,
      headers: {
        'Dropbox-API-Arg': dropboxApiArg,
        'Content-Type': 'application/octet-stream',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpRequest,
} from '@activepieces/pieces-common';
import { googleDriveAuth } from '../../';
import { common } from '../common';

export const googleDriveCreateNewFolder = createAction({
  auth: googleDriveAuth,
  name: 'create_new_gdrive_folder',
  description: 'Create a new empty folder in your Google Drive',
  displayName: 'Create new folder',
  props: {
    driveId: common.properties.driveId,
    folderName: Property.ShortText({
      displayName: 'Folder name',
      description: 'The name of the new folder',
      required: true,
    }),
    parentFolder: common.properties.parentFolder,
    // include_team_drives: common.properties.include_team_drives,
  },
  async run(context) {
    const body: Record<string, string | string[] | undefined> = {
      mimeType: 'application/vnd.google-apps.folder',
      name: context.propsValue.folderName,
      ...(context.propsValue.parentFolder
        ? { parents: [context.propsValue.parentFolder] }
        : {}),
    };

    const request: HttpRequest<Record<string, unknown>> = {
      method: HttpMethod.POST,
      url: `https://www.googleapis.com/drive/v3/files`,
      body: body,
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

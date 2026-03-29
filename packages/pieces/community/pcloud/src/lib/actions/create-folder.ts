import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pcloudAuth } from '../..';
import { pcloudCommon, PcloudCreateFolderResponse } from '../common';

export const pcloudCreateFolder = createAction({
  auth: pcloudAuth,
  name: 'create_folder',
  displayName: 'Create Folder',
  description:
    'Set up structured directories automatically for each new client onboarded through your CRM workflow.',
  props: {
    name: Property.ShortText({
      displayName: 'Folder Name',
      description: 'The name of the new folder',
      required: true,
    }),
    parentFolderId: Property.Number({
      displayName: 'Parent Folder ID',
      description:
        'The ID of the parent folder. Use 0 for the root folder.',
      required: true,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const result =
      await pcloudCommon.sendPcloudRequest<PcloudCreateFolderResponse>(
        context.auth,
        HttpMethod.GET,
        '/createfolder',
        {
          folderid: context.propsValue.parentFolderId,
          name: context.propsValue.name,
        },
      );
    return result;
  },
});

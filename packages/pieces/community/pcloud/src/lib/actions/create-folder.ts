import { createAction, Property } from '@activepieces/pieces-framework';
import { pcloudAuth } from '../auth';
import { common, PcloudCreateFolderResponse } from '../common';

export const pcloudCreateFolder = createAction({
  auth: pcloudAuth,
  name: 'pcloud_create_folder',
  displayName: 'Create Folder',
  description:
    'Set up structured directories automatically for each new client onboarded through your CRM workflow.',
  props: {
    parentFolderId: Property.Number({
      displayName: 'Parent Folder ID',
      description: 'The ID of the parent folder. Use 0 for root.',
      required: true,
      defaultValue: 0,
    }),
    name: Property.ShortText({
      displayName: 'Folder Name',
      description: 'The name of the new folder',
      required: true,
    }),
  },
  async run(context) {
    const result =
      await common.pcloudRequest<PcloudCreateFolderResponse>(
        context.auth,
        'createfolder',
        {
          folderid: context.propsValue.parentFolderId,
          name: context.propsValue.name,
        },
      );
    return result;
  },
});

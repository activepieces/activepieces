import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../auth';
import { folderMetadataOutputSchema } from '../output-schemas';

export const dropboxCopyFolder = createAction({
  auth: dropboxAuth,
  name: 'copy_dropbox_folder',
  classification: 'WRITE',
  description: 'Copy a folder and everything in it to a new path',
  audience: 'human',
  aiMetadata: { description: 'Copies the folder at the source path, including its contents, to a new destination path within Dropbox, leaving the original in place; optionally autorenames on conflict. Use to duplicate an entire directory. Not idempotent: each call creates a copy, so repeating it errors on conflict or, with autorename, produces additional duplicates.', idempotent: false },
  displayName: 'Copy Folder',
  outputSchema: folderMetadataOutputSchema,
  props: {
    from_path: Property.ShortText({
      displayName: 'From Path',
      description: 'Path of the folder to copy.',
      placeholder: '/Reports',
      required: true,
    }),
    to_path: Property.ShortText({
      displayName: 'To Path',
      description: 'New path, including the folder name.',
      placeholder: '/Archive/Reports',
      required: true,
    }),
    autorename: Property.Checkbox({
      displayName: 'Auto Rename',
      description:
        'If the name is taken, save under a new name instead of failing.',
      defaultValue: false,
      required: false,
      advanced: true,
    }),
    allow_ownership_transfer: Property.Checkbox({
      displayName: 'Allow Ownership Transfer',
      description:
        'Has no effect on copies; Dropbox applies it to moves only.',
      defaultValue: false,
      required: false,
      advanced: true,
    }),
  },
  propertyGroups: [
    {
      key: 'paths',
      display: 'section',
      label: 'From and To',
      icon: 'file',
      props: ['from_path', 'to_path'],
    },
  ],
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

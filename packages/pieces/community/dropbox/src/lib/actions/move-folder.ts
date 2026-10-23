import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../auth';
import { folderMetadataOutputSchema } from '../output-schemas';

export const dropboxMoveFolder = createAction({
  auth: dropboxAuth,
  name: 'move_dropbox_folder',
  classification: 'WRITE',
  description: 'Move or rename a folder',
  audience: 'human',
  aiMetadata: { description: 'Moves (or renames) the folder at the source path, including its contents, to a new destination path within Dropbox; optionally autorenames on conflict. Use to relocate or rename an entire directory. Not idempotent: after a successful move the source no longer exists, so repeating the call fails or, with autorename, produces a differently named folder.', idempotent: false },
  displayName: 'Move Folder',
  outputSchema: folderMetadataOutputSchema,
  props: {
    from_path: Property.ShortText({
      displayName: 'From Path',
      description: 'Path of the folder to move.',
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
        'Allow the move even if it changes who owns the folder.',
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

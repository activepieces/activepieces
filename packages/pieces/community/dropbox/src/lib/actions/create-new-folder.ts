import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../auth';
import { folderMetadataOutputSchema } from '../output-schemas';

export const dropboxCreateNewFolder = createAction({
  auth: dropboxAuth,
  name: 'create_new_dropbox_folder',
  classification: 'WRITE',
  description: 'Create a new empty folder',
  audience: 'both',
  aiMetadata: { description: 'Creates a new empty folder at the given Dropbox path; optionally autorenames on conflict. Use to set up a destination directory before placing files. Not idempotent: a repeat call for an existing path errors (or, with autorename, creates a differently named folder).', idempotent: false },
  displayName: 'Create New Folder',
  outputSchema: folderMetadataOutputSchema,
  propertyGroups: [
    { key: 'folder', display: 'section', label: 'Folder', icon: 'file', props: ['path'] },
  ],
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description: 'Path of the folder to create, starting with /.',
      placeholder: '/Reports/2026',
      required: true,
    }),
    autorename: Property.Checkbox({
      displayName: 'Auto Rename',
      description: 'If the name is taken, save under a new name instead of failing.',
      required: false,
      advanced: true,
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

    return result.body;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { canvaApiRequest, listFoldersForDropdown } from '../common';

export const getFolder = createAction({
  auth: canvaAuth,
  name: 'get_folder',
  displayName: 'Get Folder',
  description: 'Retrieve details about a Canva folder.',
  props: {
    folderId: Property.Dropdown({
      auth: canvaAuth,
      displayName: 'Folder',
      description: 'The folder to retrieve.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, placeholder: 'Connect your Canva account first.', options: [] };
        const options = await listFoldersForDropdown(auth as any);
        return { disabled: false, options };
      },
    }),
  },
  async run(context) {
    return canvaApiRequest(
      context.auth.access_token,
      HttpMethod.GET,
      `/folders/${context.propsValue.folderId}`,
    );
  },
});

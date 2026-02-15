import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../..';
import { canvaCommon } from '../common';

export const getFolder = createAction({
  auth: canvaAuth,
  name: 'get_folder',
  displayName: 'Get a Folder',
  description: 'Retrieve details about an existing folder in Canva.',
  props: {
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description: 'The ID of the folder to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    return await canvaCommon.makeRequest(
      context.auth,
      HttpMethod.GET,
      `/folders/${context.propsValue.folder_id}`,
    );
  },
});

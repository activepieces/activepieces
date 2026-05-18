import { createAction } from '@activepieces/pieces-framework';
import { makeClient, pastefyCommon } from '../common';
import { pastefyAuth } from '../..';

export default createAction({
  auth: pastefyAuth,
  name: 'get_folder',
  displayName: 'Get Folder',
  description: 'Retrieves information about a folder',
  props: {
    folder_id: pastefyCommon.folder_id(true),
  },
  async run(context) {
    const client = makeClient(context.auth, context.propsValue);
    const folder = await client.getFolder(
      context.propsValue.folder_id as string
    );
    return folder;
  },
});

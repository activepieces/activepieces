import { createAction } from '@activepieces/pieces-framework';
import { makeClient, pastefyCommon } from '../common';
import { pastefyAuth } from '../..';

export default createAction({
  auth: pastefyAuth,
  name: 'delete_folder',
  displayName: 'Delete Folder',
  description: 'Deletes a folder',
  props: {
    folder_id: pastefyCommon.folder_id(true),
  },
  async run(context) {
    const client = makeClient(context.auth, context.propsValue);
    const res = await client.deleteFolder(
      context.propsValue.folder_id as string
    );
    return res;
  },
});

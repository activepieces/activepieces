import { createAction } from '@activepieces/pieces-framework';
import { makeClient, pastefyCommon } from '../common';
import { pastefyAuth } from '../..';

export default createAction({
  auth: pastefyAuth,
  name: 'delete_folder',
  displayName: 'Delete Folder',
  description: 'Deletes a folder',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a folder by its ID from a Pastefy instance. Use to remove a folder you no longer need. Keyed on the stable folder ID, so the end state (folder absent) is the same on repeat calls; idempotent.', idempotent: true },
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

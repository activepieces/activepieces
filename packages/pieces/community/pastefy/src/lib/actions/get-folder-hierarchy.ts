import { createAction } from '@activepieces/pieces-framework';
import { makeClient, pastefyCommon } from '../common';
import { pastefyAuth } from '../..';

export default createAction({
  auth: pastefyAuth,
  name: 'get_folder_hierarchy',
  displayName: 'Get Folder Hierarchy',
  description: 'Retrieves a hierarchy of all folders',
  audience: 'both',
  aiMetadata: { description: 'Retrieves the nested tree of folders on a Pastefy instance, recursively listing each folder and its children. Pass a start folder ID to scope the tree to that subtree, or omit it to walk from the root. Use to discover folder structure or resolve folder IDs by name. Read-only and idempotent.', idempotent: true },
  props: {
    parent_id: pastefyCommon.folder_id(false, 'Start Folder'),
  },
  async run(context) {
    const client = makeClient(context.auth, context.propsValue);
    const hierarchy = await client.getFolderHierarchy(
      context.propsValue.parent_id
    );
    return hierarchy;
  },
});

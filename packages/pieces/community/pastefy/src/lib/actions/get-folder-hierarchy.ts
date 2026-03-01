import { createAction } from '@activepieces/pieces-framework';
import { makeClient, pastefyCommon } from '../common';
import { pastefyAuth } from '../..';

export default createAction({
  auth: pastefyAuth,
  name: 'get_folder_hierarchy',
  displayName: 'Get Folder Hierarchy',
  description: 'Retrieves a hierarchy of all folders',
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

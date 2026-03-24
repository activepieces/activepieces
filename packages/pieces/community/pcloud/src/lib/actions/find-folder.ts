import { createAction, Property } from '@activepieces/pieces-framework';
import { pcloudAuth } from '../auth';
import { PCloudClient } from '../common/client';

export const findFolder = createAction({
  auth: pcloudAuth,
  name: 'pcloud_find_folder',
  displayName: 'Find Folder',
  description: 'Search for a folder by name in a pCloud folder.',
  props: {
    folder_id: Property.Number({
      displayName: 'Parent Folder ID',
      description: 'The ID of the folder to search in. Use 0 for the root folder.',
      required: true,
      defaultValue: 0,
    }),
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The folder name (or part of it) to search for.',
      required: true,
    }),
  },
  async run(context) {
    const client = new PCloudClient(context.auth);
    const folder = await client.listFolder(context.propsValue.folder_id);
    const query = context.propsValue.query.toLowerCase();

    const matches = folder.contents.filter(
      (item) => item.isfolder && item.name.toLowerCase().includes(query),
    );

    return matches;
  },
});

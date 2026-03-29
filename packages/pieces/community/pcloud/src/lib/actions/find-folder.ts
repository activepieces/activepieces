import { createAction, Property } from '@activepieces/pieces-framework';
import { pcloudAuth } from '../..';
import { pcloudCommon, PcloudMetadata } from '../common';

function collectFolders(
  metadata: PcloudMetadata,
  query: string,
): PcloudMetadata[] {
  const results: PcloudMetadata[] = [];
  const lowerQuery = query.toLowerCase();

  if (metadata.contents) {
    for (const item of metadata.contents) {
      if (item.isfolder) {
        if (item.name.toLowerCase().includes(lowerQuery)) {
          results.push(item);
        }
        if (item.contents) {
          results.push(...collectFolders(item, query));
        }
      }
    }
  }
  return results;
}

export const pcloudFindFolder = createAction({
  auth: pcloudAuth,
  name: 'find_folder',
  displayName: 'Find Folder',
  description:
    'Locate project-specific folders before performing batch operations like archiving or sharing.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description:
        'The text to search for in folder names (case-insensitive)',
      required: true,
    }),
    folderId: Property.Number({
      displayName: 'Folder ID',
      description:
        'The ID of the folder to search in. Use 0 for the root folder.',
      required: true,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const response = await pcloudCommon.listFolder(
      context.auth,
      context.propsValue.folderId,
      true,
    );
    const folders = collectFolders(
      response.metadata,
      context.propsValue.query,
    );
    return { folders };
  },
});

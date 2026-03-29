import { createAction, Property } from '@activepieces/pieces-framework';
import { pcloudAuth } from '../..';
import { pcloudCommon, PcloudMetadata } from '../common';

function collectFiles(
  metadata: PcloudMetadata,
  query: string,
): PcloudMetadata[] {
  const results: PcloudMetadata[] = [];
  const lowerQuery = query.toLowerCase();

  if (metadata.contents) {
    for (const item of metadata.contents) {
      if (!item.isfolder && item.name.toLowerCase().includes(lowerQuery)) {
        results.push(item);
      }
      if (item.isfolder && item.contents) {
        results.push(...collectFiles(item, query));
      }
    }
  }
  return results;
}

export const pcloudFindFile = createAction({
  auth: pcloudAuth,
  name: 'find_file',
  displayName: 'Find File',
  description:
    'Find and process all files matching a search query for automated reporting tasks.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description:
        'The text to search for in file names (case-insensitive)',
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
    const files = collectFiles(response.metadata, context.propsValue.query);
    return { files };
  },
});

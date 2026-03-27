import { createAction, Property } from '@activepieces/pieces-framework';
import { pcloudAuth } from '../auth';
import { common, PcloudListFolderResponse, PcloudMetadata } from '../common';

export const pcloudFindFolder = createAction({
  auth: pcloudAuth,
  name: 'pcloud_find_folder',
  displayName: 'Find Folder',
  description:
    'Locate project-specific folders before performing batch operations like archiving or sharing.',
  props: {
    query: Property.ShortText({
      displayName: 'Folder Name',
      description: 'The folder name or partial name to search for',
      required: true,
    }),
    parentFolderId: Property.Number({
      displayName: 'Parent Folder ID',
      description:
        'Search within this folder (recursively). Use 0 for root.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const result =
      await common.pcloudRequest<PcloudListFolderResponse>(
        context.auth,
        'listfolder',
        {
          folderid: context.propsValue.parentFolderId ?? 0,
          recursive: 1,
        },
      );

    const query = context.propsValue.query.toLowerCase();
    const matches: PcloudMetadata[] = [];

    function searchContents(contents: PcloudMetadata[] | undefined) {
      if (!contents) return;
      for (const item of contents) {
        if (item.isfolder && item.name.toLowerCase().includes(query)) {
          matches.push(item);
        }
        if (item.contents) {
          searchContents(item.contents);
        }
      }
    }

    searchContents(result.metadata.contents);
    return { result: 0, folders: matches };
  },
});

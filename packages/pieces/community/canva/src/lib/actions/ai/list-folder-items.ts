import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../common';
import { canvaOutputSchemas } from '../../common/output-schemas';
import { listFolderItemsRequest } from '../list-folder-items';

export const canvaListFolderItemsAi = createAction({
  auth: canvaAuth,
  name: 'canva_list_folder_items',
  displayName: 'List Folder Items',
  description: 'Lists designs, images and subfolders in a Canva folder.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: canvaOutputSchemas.listFolderItems,
  aiMetadata: {
    description:
      'Lists the items in a Canva folder, one page at a time: each item has type (design, folder, image), id and name. Use folderId "root" for the top level of Projects and "uploads" for the Uploads folder; pass a returned folder id to go deeper. Video assets are not listed by Canva. Use the continuation token for the next page.',
    idempotent: true,
  },
  props: {
    folderId: Property.ShortText({ displayName: 'Folder ID', description: 'Folder ID, or root, or uploads.', required: true }),
    itemTypes: Property.Array({ displayName: 'Item Types', description: 'Any of design, folder, image. Empty returns all three.', required: false }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Default modified_descending.',
      required: false,
      options: {
        options: ['modified_descending', 'modified_ascending', 'created_descending', 'created_ascending', 'title_ascending', 'title_descending'].map((v) => ({ label: v, value: v })),
      },
    }),
    limit: Property.Number({ displayName: 'Limit', description: 'Items per page, 1-100. Default 50.', required: false }),
    continuation: Property.ShortText({ displayName: 'Continuation', description: 'Continuation token from the previous page.', required: false }),
  },
  async run(context) {
    const { folderId, itemTypes, sortBy, limit, continuation } = context.propsValue;
    return listFolderItemsRequest({
      token: context.auth.access_token,
      folderId,
      itemTypes: (itemTypes ?? []).map((t) => String(t)),
      sortBy: sortBy ?? undefined,
      limit: limit ?? undefined,
      continuation: continuation ?? undefined,
    });
  },
});

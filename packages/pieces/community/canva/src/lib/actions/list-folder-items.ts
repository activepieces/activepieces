import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth, canvaCommon, canvaProps } from '../common';
import { canvaOutputSchemas } from '../common/output-schemas';

export const listFolderItems = createAction({
  auth: canvaAuth,
  name: 'list_folder_items',
  classification: 'SEARCH',
  displayName: 'List Folder Items',
  description: 'List the designs, images and subfolders in a folder. Returns one page; use the continuation token for the next page.',
  audience: 'human',
  aiMetadata: {
    description: 'Lists items in a Canva folder. Human step; agents use canva_list_folder_items. Read-only.',
    idempotent: true,
  },
  outputSchema: canvaOutputSchemas.listFolderItems,
  props: {
    folderId: canvaProps.folderDropdown({ displayName: 'Folder', description: 'The folder to list.' }),
    itemTypes: Property.StaticMultiSelectDropdown({
      displayName: 'Item Types',
      description: 'Only return these kinds of items. Leave empty for designs, folders and images.',
      required: false,
      options: {
        options: [
          { label: 'Designs', value: 'design' },
          { label: 'Folders', value: 'folder' },
          { label: 'Images', value: 'image' },
        ],
      },
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'How to order the items.',
      required: false,
      defaultValue: 'modified_descending',
      options: {
        options: [
          { label: 'Recently modified', value: 'modified_descending' },
          { label: 'Oldest modified', value: 'modified_ascending' },
          { label: 'Newest created', value: 'created_descending' },
          { label: 'Oldest created', value: 'created_ascending' },
          { label: 'Title A-Z', value: 'title_ascending' },
          { label: 'Title Z-A', value: 'title_descending' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'How many items to return (1-100, default 50).',
      required: false,
      defaultValue: 50,
    }),
    continuation: Property.ShortText({
      displayName: 'Continuation Token',
      description: 'Token from a previous run to get the next page.',
      required: false,
    }),
  },
  async run(context) {
    const { folderId, itemTypes, sortBy, limit, continuation } = context.propsValue;
    return listItems({
      token: context.auth.access_token,
      folderId,
      itemTypes: itemTypes ?? undefined,
      sortBy: sortBy ?? undefined,
      limit: limit ?? undefined,
      continuation: continuation ?? undefined,
    });
  },
});

async function listItems({
  token,
  folderId,
  itemTypes,
  sortBy,
  limit,
  continuation,
}: {
  token: string;
  folderId: string;
  itemTypes?: string[];
  sortBy?: string;
  limit?: number;
  continuation?: string;
}) {
  const id = folderId.trim();
  if (!id) {
    throw new Error('Folder is required.');
  }
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 100)) {
    throw new Error('Limit must be a whole number between 1 and 100.');
  }
  const allowed = ['design', 'folder', 'image'];
  const types = (itemTypes ?? []).map((t) => t.trim()).filter((t) => t.length > 0);
  const invalid = types.find((t) => !allowed.includes(t));
  if (invalid) {
    throw new Error(`Unknown item type "${invalid}". Use design, folder or image.`);
  }
  const page = await canvaCommon.listFolderPage({
    token,
    folderId: id,
    itemTypes: types.length > 0 ? types.join(',') : undefined,
    sortBy,
    limit,
    continuation: continuation?.trim() || undefined,
  });
  return {
    items: page.items.map((item) => canvaCommon.flattenFolderItem(item)),
    has_more: Boolean(page.continuation),
    continuation: page.continuation ?? null,
  };
}

export const listFolderItemsRequest = listItems;

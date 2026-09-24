import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { GraphDriveItem, oneDriveApi } from '../common/graph-api';
import { onedriveListItemsOutputSchema } from '../output-schemas';

export const onedriveListFolderChildren = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_list_folder_children',
  displayName: 'List Folder Contents',
  description: 'List the files and folders inside a folder, one page at a time.',
  audience: 'ai',
  outputSchema: onedriveListItemsOutputSchema,
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'List the direct children of one folder (the drive root when no folder is given), optionally keeping only files or only folders, one page per call. Use Search Files and Folders to find items by name anywhere in the drive. The type filter is applied after the page is fetched, so a page can come back empty while nextPageToken is still set: keep paging until nextPageToken is null.',
    idempotent: true,
  },
  props: {
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'Folder ID. Leave this and Folder Path empty for the drive root.',
      required: false,
    }),
    folderPath: Property.ShortText({
      displayName: 'Folder Path',
      description: 'Folder path from the drive root. Used when Folder ID is empty.',
      placeholder: 'Documents/Reports',
      required: false,
    }),
    itemType: Property.StaticDropdown({
      displayName: 'Item Type',
      required: false,
      defaultValue: 'all',
      options: {
        disabled: false,
        options: [
          { label: 'Files and folders', value: 'all' },
          { label: 'Files only', value: 'files' },
          { label: 'Folders only', value: 'folders' },
        ],
      },
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'How many items to request per page (1-999). Defaults to 100.',
      required: false,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'nextPageToken from the previous call. Empty for the first page.',
      required: false,
    }),
  },
  async run(context) {
    const { folderId, folderPath, itemType, pageSize, pageToken } = context.propsValue;
    const token = pageToken?.trim();
    const response = await oneDriveApi.request<GraphItemPage>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: token
        ? token
        : `${resolveFolder({ folderId, folderPath })}/children`,
      queryParams: token ? undefined : { $top: String(clampPageSize({ pageSize })) },
    });
    const items = response.value
      .filter((item) => matchesType({ item, itemType: itemType ?? 'all' }))
      .map((item) => oneDriveApi.toItem(item));
    return {
      items,
      count: items.length,
      nextPageToken: response['@odata.nextLink'] ?? null,
    };
  },
});

function resolveFolder({ folderId, folderPath }: { folderId?: string; folderPath?: string }): string {
  if (!folderId?.trim() && folderPath?.trim()) {
    return oneDriveApi.itemPath({ path: folderPath });
  }
  return oneDriveApi.folderPath({ folderId });
}

function matchesType({ item, itemType }: { item: GraphDriveItem; itemType: string }): boolean {
  if (itemType === 'files') {
    return item.file !== undefined;
  }
  if (itemType === 'folders') {
    return item.folder !== undefined;
  }
  return true;
}

function clampPageSize({ pageSize }: { pageSize?: number }): number {
  if (pageSize === undefined || pageSize === null || Number.isNaN(pageSize)) {
    return 100;
  }
  return Math.min(Math.max(Math.floor(pageSize), 1), 999);
}

type GraphItemPage = {
  value: GraphDriveItem[];
  '@odata.nextLink'?: string;
};

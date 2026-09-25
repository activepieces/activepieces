import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { oneDriveApi } from '../common/graph-api';
import { onedriveListItemThumbnailsOutputSchema } from '../output-schemas';

export const onedriveListItemThumbnails = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_list_item_thumbnails',
  displayName: 'Get File Thumbnails',
  description: 'Get the small, medium and large thumbnail image URLs of a file.',
  audience: 'ai',
  outputSchema: onedriveListItemThumbnailsOutputSchema,
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Get the thumbnail image URLs (small, medium, large, with sizes) that OneDrive generated for one file, for previews or image galleries. Provide the item ID (from Search Files and Folders or List Folder Contents) or a path; an empty result is normal for a new file whose thumbnails are not generated yet, or for file types without thumbnails. The URLs are short-lived. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'File ID from Search or List Folder Contents. Or use Path.',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'File path from the drive root. Used when Item ID is empty.',
      placeholder: 'Photos/beach.jpg',
      required: false,
    }),
  },
  async run(context) {
    const { itemId, path } = context.propsValue;
    const response = await oneDriveApi.request<GraphThumbnailList>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `${oneDriveApi.itemPath({ itemId, path })}/thumbnails`,
    });
    const items = response.value.map((set) => ({
      thumbnailSetId: set.id ?? null,
      smallUrl: set.small?.url ?? null,
      smallWidth: set.small?.width ?? null,
      smallHeight: set.small?.height ?? null,
      mediumUrl: set.medium?.url ?? null,
      mediumWidth: set.medium?.width ?? null,
      mediumHeight: set.medium?.height ?? null,
      largeUrl: set.large?.url ?? null,
      largeWidth: set.large?.width ?? null,
      largeHeight: set.large?.height ?? null,
    }));
    return {
      items,
      count: items.length,
    };
  },
});

type GraphThumbnail = {
  url?: string;
  width?: number;
  height?: number;
};

type GraphThumbnailList = {
  value: {
    id?: string;
    small?: GraphThumbnail;
    medium?: GraphThumbnail;
    large?: GraphThumbnail;
  }[];
};

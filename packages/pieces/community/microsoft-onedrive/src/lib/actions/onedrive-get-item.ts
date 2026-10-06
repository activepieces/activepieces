import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { GraphDriveItem, oneDriveApi } from '../common/graph-api';
import { onedriveItemOutputSchema } from '../output-schemas';

export const onedriveGetItem = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_get_item',
  displayName: 'Get File or Folder',
  description: 'Get the metadata of a file or folder by its ID or path.',
  audience: 'ai',
  outputSchema: onedriveItemOutputSchema,
  classification: 'READ',
  aiMetadata: {
    description:
      'Read the metadata of one file or folder (name, size, type, parent, dates, web link) without downloading its content. Provide either the item ID (from Search Files and Folders or List Folder Contents; "root" is the drive root) or a path relative to the drive root; use Download File when you need the bytes. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'Item ID from Search or List Folder Contents, or "root". Or use Path.',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'Path from the drive root. Used when Item ID is empty.',
      placeholder: 'Documents/report.docx',
      required: false,
    }),
  },
  async run(context) {
    const { itemId, path } = context.propsValue;
    const item = await oneDriveApi.request<GraphDriveItem>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: oneDriveApi.itemPath({ itemId, path }),
    });
    return oneDriveApi.toItem(item);
  },
});

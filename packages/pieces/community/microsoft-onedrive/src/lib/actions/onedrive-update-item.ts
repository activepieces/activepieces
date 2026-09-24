import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { GraphDriveItem, oneDriveApi } from '../common/graph-api';
import { onedriveItemOutputSchema } from '../output-schemas';

export const onedriveUpdateItem = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_update_item',
  displayName: 'Rename / Update File or Folder',
  description: 'Rename a OneDrive file or folder, or set its description.',
  audience: 'ai',
  outputSchema: onedriveItemOutputSchema,
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Renames a file or folder and/or sets its description, changing only the fields you provide; the item keeps its ID. Use Move File or Folder to change its folder. Description is supported on personal OneDrive only, and renaming fails if the folder already has an item with the new name. Safe to retry.',
    idempotent: true,
  },
  props: {
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description:
        'The ID of the file or folder, from Search Files and Folders or List Folder Contents. Provide either this or Path.',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'The item path relative to the drive root, e.g. `Documents/report.docx`. Provide either this or Item ID.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'The new name, including the extension for files. Leave empty to keep the current name.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The new description. Personal OneDrive only. Leave empty to keep the current description.',
      required: false,
    }),
  },
  async run(context) {
    const { itemId, path, name, description } = context.propsValue;
    const itemPath = oneDriveApi.itemPath({ itemId, path });
    const body: Record<string, string> = {};
    const trimmedName = name?.trim();
    if (trimmedName) {
      body['name'] = trimmedName;
    }
    if (description !== undefined && description !== null && description !== '') {
      body['description'] = description;
    }
    if (Object.keys(body).length === 0) {
      throw new Error('Provide a New Name or a Description to update.');
    }
    const item = await oneDriveApi.request<GraphDriveItem>({
      auth: context.auth,
      method: HttpMethod.PATCH,
      path: itemPath,
      body,
    });
    return oneDriveApi.toItem(item);
  },
});

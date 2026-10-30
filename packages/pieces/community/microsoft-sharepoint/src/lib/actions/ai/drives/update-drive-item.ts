import { createAction, Property } from '@activepieces/pieces-framework';
import type { DriveItem } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointCreateFolderOutputSchema } from '../../../output-schemas';

export const updateDriveItemAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_update_drive_item',
  outputSchema: microsoftSharepointCreateFolderOutputSchema,
  displayName: 'Update Drive Item',
  description: 'Renames, moves or describes a file or folder in a document library.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Renames a file or folder, moves it to another folder of the same drive, or sets its description, changing only the fields you provide; the item keeps its ID. Moving between drives is not supported; use Copy Item for that. List Folder Children, Find File and Search return item and folder IDs.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'New name, with the extension for files. Leave empty to keep the name.',
      required: false,
    }),
    parentFolderId: Property.ShortText({
      displayName: 'Destination Folder ID',
      description:
        'ID of the folder in the same drive to move the item into. For the drive root, use the ID returned by List Folder Children or Get Drive Item, not "root". Leave empty to keep it in place.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description:
        'New description of the item. Microsoft Graph supports it on OneDrive personal only. Leave empty to keep it.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: DriveItem = {
      ...(propsValue.name !== undefined ? { name: propsValue.name } : {}),
      ...(propsValue.description !== undefined
        ? { description: propsValue.description }
        : {}),
      ...(propsValue.parentFolderId !== undefined
        ? { parentReference: { id: propsValue.parentFolderId } }
        : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error(
        'Provide at least one of New Name, Destination Folder ID or Description.'
      );
    }
    const item: DriveItem = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}`
      )
      .patch(body);
    return item;
  },
});

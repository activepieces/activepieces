import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { oneDriveApi } from '../common/graph-api';
import { onedriveItemActionOutputSchema } from '../output-schemas';

export const onedriveDiscardCheckout = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_discard_checkout',
  displayName: 'Discard Check-Out',
  description: 'Undo a check-out and throw away any changes made while the file was checked out.',
  audience: 'ai',
  outputSchema: onedriveItemActionOutputSchema,
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Releases the check-out on a file in a OneDrive for Business or SharePoint document library and permanently discards every change made while it was checked out, reverting to the last checked-in version. Use Check In File instead to keep the changes; personal OneDrive may not support check-out, and a retry fails once the file is no longer checked out.',
    idempotent: false,
  },
  props: {
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description:
        'The ID of the file, from Search Files and Folders or List Folder Contents. Provide either this or Path.',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'The file path relative to the drive root, e.g. `Documents/report.docx`. Provide either this or Item ID.',
      required: false,
    }),
  },
  async run(context) {
    const { itemId, path } = context.propsValue;
    await oneDriveApi.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `${oneDriveApi.itemPath({ itemId, path })}/discardCheckout`,
    });
    return {
      success: true,
      itemId: itemId?.trim() || null,
      path: path?.trim() || null,
    };
  },
});

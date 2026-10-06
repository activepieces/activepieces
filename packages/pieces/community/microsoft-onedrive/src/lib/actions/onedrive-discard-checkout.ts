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
      'Releases the check-out on a file and permanently discards every change made while it was checked out, reverting to the last checked-in version. Use Check In File instead to keep the changes. Works on personal and business drives; a retry fails once the file is no longer checked out.',
    idempotent: false,
  },
  props: {
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'File ID from Search or List Folder Contents. Or use Path.',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'File path from the drive root. Use this or Item ID.',
      placeholder: 'Documents/report.docx',
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

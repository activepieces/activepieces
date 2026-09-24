import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { oneDriveApi } from '../common/graph-api';
import { onedriveItemActionOutputSchema } from '../output-schemas';

export const onedriveCheckoutItem = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_checkout_item',
  displayName: 'Check Out File',
  description: 'Check out a file so others cannot edit it until it is checked in.',
  audience: 'ai',
  outputSchema: onedriveItemActionOutputSchema,
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Checks out a file in a OneDrive for Business or SharePoint document library, locking it for exclusive editing until Check In File or Discard Check-Out is called. Intended for business libraries; personal OneDrive may not support check-out, and checking out a file that is already checked out fails.',
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
      path: `${oneDriveApi.itemPath({ itemId, path })}/checkout`,
    });
    return {
      success: true,
      itemId: itemId?.trim() || null,
      path: path?.trim() || null,
    };
  },
});

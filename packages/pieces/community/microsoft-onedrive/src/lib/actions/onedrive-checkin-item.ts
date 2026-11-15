import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { oneDriveApi } from '../common/graph-api';
import { onedriveItemActionOutputSchema } from '../output-schemas';

export const onedriveCheckinItem = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_checkin_item',
  displayName: 'Check In File',
  description: 'Check in a checked-out file so its changes become visible to others.',
  audience: 'ai',
  outputSchema: onedriveItemActionOutputSchema,
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Checks in a file previously checked out with Check Out File, publishing the changes and releasing the lock. Use Discard Check-Out instead to throw the changes away. Works on personal and business drives; checking in a file that is not checked out fails.',
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
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'Optional check-in comment saved with the new version.',
      required: false,
    }),
  },
  async run(context) {
    const { itemId, path, comment } = context.propsValue;
    const body: Record<string, unknown> = {};
    if (comment) {
      body['comment'] = comment;
    }
    await oneDriveApi.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `${oneDriveApi.itemPath({ itemId, path })}/checkin`,
      body,
    });
    return {
      success: true,
      itemId: itemId?.trim() || null,
      path: path?.trim() || null,
    };
  },
});

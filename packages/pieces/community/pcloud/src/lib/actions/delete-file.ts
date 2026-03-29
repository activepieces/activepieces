import {
  createAction,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { pcloudAuth, API_BASE_URL } from '../auth';
import { PCloudClient } from '../common/client';
import { fileId } from './download-file';

/**
 * Delete File Action
 * Deletes a file from pCloud
 */
export const deleteFile = createAction({
  auth: pcloudAuth,
  displayName: 'Delete File',
  description: 'Delete a file from pCloud',
  props: {
    file_id: fileId,
  },
  async run(context) {
    const client = new PCloudClient(context.auth);
    const result = await client.deleteFile(context.propsValue.file_id);
    return result;
  },
});

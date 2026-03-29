import {
  createAction,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { pcloudAuth, folderId } from '../auth';
import { PCloudClient } from '../lib/common/client';
import { fileId } from './download-file';

/**
 * Copy File Action
 * Copies a file to another folder
 */
export const copyFile = createAction({
  auth: pcloudAuth,
  displayName: 'Copy File',
  description: 'Copy a file to another folder in pCloud',
  props: {
    file_id: fileId,
    destination_folder_id: folderId,
    new_name: Property.ShortText({
      displayName: 'New Name (Optional)',
      description: 'New name for the copied file',
      required: false,
    }),
    no_overwrite: Property.Checkbox({
      displayName: 'Don\'t Overwrite',
      description: 'Don\'t overwrite if file with same name exists',
      required: false,
    }),
  },
  async run(context) {
    const client = new PCloudClient(context.auth);
    const { file_id, destination_folder_id, new_name } = context.propsValue;

    const result = await client.copyFile(
      file_id,
      destination_folder_id,
      new_name
    );

    return result;
  },
});

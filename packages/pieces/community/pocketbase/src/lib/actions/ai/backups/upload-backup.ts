import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseBackupResultOutputSchema } from '../../../output-schemas';

export const uploadBackupAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_upload_backup',
  outputSchema: pocketbaseBackupResultOutputSchema,
  displayName: 'Upload Backup',
  description: 'Uploads a backup zip file to the instance.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Uploads an existing PocketBase backup zip so it appears in List Backups; it does not restore it. The file name must be unique among stored backups. Use Restore Backup afterwards to apply it.',
    idempotent: false,
  },
  props: {
    file: Property.File({
      displayName: 'Backup File',
      description: 'A PocketBase backup .zip file, e.g. one returned by Download Backup.',
      required: true,
    }),
  },
  async run(context) {
    const { file } = context.propsValue;
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(file.data)], { type: 'application/zip' }), file.filename);
    await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/api/backups/upload',
      body: form,
    });
    return { success: true, key: file.filename };
  },
});

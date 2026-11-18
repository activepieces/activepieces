import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseCreateBackupOutputSchema } from '../../../output-schemas';

export const createBackupAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_create_backup',
  outputSchema: pocketbaseCreateBackupOutputSchema,
  displayName: 'Create Backup',
  description: 'Creates a new backup of the database and files.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates a zip backup of the database and uploaded files. Only one backup or restore can run at a time. Without a Name the instance picks one; List Backups shows the new key.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Backup file name using only a-z, 0-9, _ and -, ending in .zip, e.g. "before_import.zip". Leave empty for an automatic name.',
      required: false,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;
    await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/api/backups',
      body: name ? { name } : {},
    });
    return { success: true, name: name ?? null };
  },
});

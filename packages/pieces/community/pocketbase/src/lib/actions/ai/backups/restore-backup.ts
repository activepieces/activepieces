import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseBackupResultOutputSchema } from '../../../output-schemas';

export const restoreBackupAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_restore_backup',
  outputSchema: pocketbaseBackupResultOutputSchema,
  displayName: 'Restore Backup',
  description: 'Replaces the current data with a stored backup and restarts the instance.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Replaces the whole database and uploaded files with a stored backup, then restarts the instance; everything written since that backup is lost. Run Create Backup first to keep the current state. The key comes from List Backups.',
    idempotent: false,
  },
  props: {
    key: Property.ShortText({
      displayName: 'Backup Key',
      description: 'Backup file name to restore. List Backups returns it.',
      required: true,
    }),
  },
  async run(context) {
    const { key } = context.propsValue;
    await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/api/backups/${encodeURIComponent(key)}/restore`,
    });
    return { success: true, key };
  },
});

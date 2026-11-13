import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseBackupResultOutputSchema } from '../../../output-schemas';

export const deleteBackupAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_delete_backup',
  outputSchema: pocketbaseBackupResultOutputSchema,
  displayName: 'Delete Backup',
  description: 'Permanently deletes a stored backup file.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes one stored backup zip; the live data is not touched. The key comes from List Backups.',
    idempotent: false,
  },
  props: {
    key: Property.ShortText({
      displayName: 'Backup Key',
      description: 'Backup file name to delete. List Backups returns it.',
      required: true,
    }),
  },
  async run(context) {
    const { key } = context.propsValue;
    await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/api/backups/${encodeURIComponent(key)}`,
    });
    return { success: true, key };
  },
});

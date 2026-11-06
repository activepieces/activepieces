import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseListBackupsOutputSchema } from '../../../output-schemas';

export const listBackupsAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_list_backups',
  outputSchema: pocketbaseListBackupsOutputSchema,
  displayName: 'List Backups',
  description: 'Lists the stored backup files.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists every stored backup with its key (file name), size and last modified time. The key is what Download Backup, Restore Backup and Delete Backup take.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const backups = await pocketbaseClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/api/backups',
    });
    return { backups, count: backups.length };
  },
});

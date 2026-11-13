import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseSuccessOutputSchema } from '../../../output-schemas';

export const deleteLogsAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_delete_logs',
  outputSchema: pocketbaseSuccessOutputSchema,
  displayName: 'Delete Logs',
  description: 'Permanently deletes all logs.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes every stored log entry; this cannot be undone. Logs older than the retention in settings are already removed automatically, so use this only to clear all logs now.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: '/api/logs',
    });
    return { success: true };
  },
});

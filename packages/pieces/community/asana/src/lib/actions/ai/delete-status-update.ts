import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaDeleteStatusUpdateOutputSchema } from '../../output-schemas';

export const asanaDeleteStatusUpdateAction = createAction({
  auth: asanaAuth,
  name: 'delete_status_update',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Status Update',
  description: 'Delete a status update from an Asana project, portfolio or goal.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one status update. Irreversible; repeating the call on the same update fails.',
    idempotent: false,
  },
  outputSchema: asanaDeleteStatusUpdateOutputSchema,
  props: {
    status_update: Property.ShortText({
      displayName: 'Status Update GID',
      description: 'Gid of the status update to delete. Obtain it from List Status Updates.',
      required: true,
    }),
  },
  async run(context) {
    const statusUpdate = context.propsValue.status_update.trim();
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/status_updates/${asanaUtils.pathSegment(statusUpdate)}`,
      operation: 'Delete Status Update',
    });
    return { success: true, status_update_gid: statusUpdate };
  },
});

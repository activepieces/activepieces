import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaStatusUpdateOutputSchema } from '../../output-schemas';

export const asanaGetStatusUpdateAction = createAction({
  auth: asanaAuth,
  name: 'get_status_update',
  classification: 'READ',
  displayName: 'Get Status Update',
  description: 'Get one status update of an Asana project, portfolio or goal.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one status update by gid with its status type, title, text, author, parent and timestamps. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaStatusUpdateOutputSchema,
  props: {
    status_update: Property.ShortText({
      displayName: 'Status Update GID',
      description: 'Gid of the status update. Obtain it from List Status Updates or Create Status Update.',
      required: true,
    }),
  },
  async run(context) {
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/status_updates/${asanaUtils.pathSegment(context.propsValue.status_update)}`,
      operation: 'Get Status Update',
      query: { opt_fields: ASANA_FIELDS.statusUpdate },
    });
  },
});

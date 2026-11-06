import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseGetLogOutputSchema } from '../../../output-schemas';

export const getLogAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_get_log',
  outputSchema: pocketbaseGetLogOutputSchema,
  displayName: 'Get Log',
  description: 'Gets one log entry by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one log entry with its level, message and full data. The log ID comes from List Logs.',
    idempotent: true,
  },
  props: {
    logId: Property.ShortText({
      displayName: 'Log ID',
      description: 'ID of the log entry. List Logs returns it.',
      required: true,
    }),
  },
  async run(context) {
    return await pocketbaseClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/api/logs/${encodeURIComponent(context.propsValue.logId)}`,
    });
  },
});

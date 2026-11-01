import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bolnaaiAuth } from '../common/auth';
import { bolnaClient } from '../common/client';
import { bolnaSchemas } from '../common/schemas';

export const stopCall = createAction({
  auth: bolnaaiAuth,
  name: 'stop_call',
  displayName: 'Stop Call',
  description: 'Stop a queued or scheduled Bolna call before it is dialed.',
  audience: 'both',
  classification: 'DESTRUCTIVE',
  outputSchema: bolnaSchemas.callResponseSchema,
  aiMetadata: {
    description:
      'Stops a Bolna call that is still queued or scheduled, using its execution ID. Calls already ringing, in progress or finished cannot be stopped and the vendor returns an error. Check the status with Get Call Execution first if unsure.',
    idempotent: false,
  },
  props: {
    executionId: Property.ShortText({
      displayName: 'Execution ID',
      description: 'The execution ID of the queued or scheduled call.',
      required: true,
    }),
  },
  async run(context) {
    return bolnaClient.makeRequest<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/call/${encodeURIComponent(context.propsValue.executionId.trim())}/stop`,
    });
  },
});

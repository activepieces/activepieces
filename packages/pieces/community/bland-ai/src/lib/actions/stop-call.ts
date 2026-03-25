import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { blandAiAuth } from '../auth';
import { blandApiCall } from '../common/client';

export const stopCall = createAction({
  auth: blandAiAuth,
  name: 'stop_call',
  displayName: 'Stop Call',
  description: 'End an active AI phone call immediately.',
  props: {
    callId: Property.ShortText({
      displayName: 'Call ID',
      description: 'The unique identifier of the call to stop.',
      required: true,
    }),
  },
  async run(context) {
    return blandApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/calls/${encodeURIComponent(context.propsValue.callId)}/stop`,
    });
  },
});

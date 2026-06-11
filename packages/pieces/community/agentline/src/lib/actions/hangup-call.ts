import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { agentlineAuth } from '../..';
import { agentlineApiCall } from '../common';

export const hangupCall = createAction({
  auth: agentlineAuth,
  name: 'hangup_call',
  displayName: 'Hang Up Call',
  description: 'Terminate an active voice call',
  audience: 'both',
  aiMetadata: {
    description:
      'Hangs up an active voice call by its call ID. The call will be marked as completed. Not idempotent — calling on an already-completed call is harmless but returns a different message.',
    idempotent: false,
  },
  props: {
    call_id: Property.ShortText({
      displayName: 'Call ID',
      description: 'The call ID to hang up',
      required: true,
    }),
  },
  async run(context) {
    const response = await agentlineApiCall(
      context.auth as string,
      HttpMethod.POST,
      `/v1/calls/${context.propsValue.call_id}/hangup`,
    );
    return response.body;
  },
});

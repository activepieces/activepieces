import { createAction, Property } from '@activepieces/pieces-framework';
import { vapiAuth } from '../auth';
import { createVapiClient } from '../common/client';

export const getCall = createAction({
  auth: vapiAuth,
  name: 'get_call',
  displayName: 'Get Call',
  description: 'Retrieve the details of a specific call by its ID.',
  audience: 'both',
  aiMetadata: { description: 'Look up a single Vapi call by its unique ID and return its details (status, transcript, outcome, and related metadata). Use to check the result or progress of a call you previously initiated. Read-only and idempotent.', idempotent: true },
  props: {
    callId: Property.ShortText({
      displayName: 'Call ID',
      description: 'The unique identifier of the call to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const client = createVapiClient(context.auth.secret_text);
    const call = await client.calls.get({ id: context.propsValue.callId });
    return call;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { vapiAuth } from '../auth';
import { createVapiClient } from '../common/client';

export const getCall = createAction({
  auth: vapiAuth,
  name: 'get_call',
  displayName: 'Get Call',
  description: 'Retrieve the details of a specific call by its ID.',
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

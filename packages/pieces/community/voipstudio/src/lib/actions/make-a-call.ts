import { createAction, Property } from '@activepieces/pieces-framework';
import { voipstudioAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const makeACall = createAction({
  auth: voipstudioAuth,
  name: 'makeACall',
  displayName: 'Make a Call',
  description: 'Make a call to a number in e164 format',
  props: {
    to: Property.ShortText({
      displayName: 'To',
      description: 'Destination number in e164 format',
      required: true,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description: 'User ID from which call should originate',
      required: false,
    }),
    caller_id: Property.ShortText({
      displayName: 'Caller ID',
      description: "Caller ID to use for the call. E164 number or 'anonymous'",
      required: false,
    }),
  },
  async run(context) {
    const { to, from, caller_id } = context.propsValue;

    const body: any = {
      to,
    };

    if (from !== undefined) body.from = from;
    if (caller_id !== undefined) body.caller_id = caller_id;

    return await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/calls',
      body
    );
  },
});

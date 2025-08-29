import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callTwilioApi } from '../common';
import { twilioAuth } from '../..';

export const twilioGetMessage = createAction({
  auth: twilioAuth,
  name: 'get_message',
  displayName: 'Get Message',
  description: 'Return details of a specific message',
  props: {
    message_sid: Property.ShortText({
      displayName: 'Message SID',
      description: 'The unique identifier of the message to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const { message_sid } = context.propsValue;
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;

    return await callTwilioApi(
      HttpMethod.GET,
      `Messages/${message_sid}.json`,
      { account_sid, auth_token },
      {}
    );
  },
});

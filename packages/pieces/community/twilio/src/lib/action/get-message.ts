import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callTwilioApi } from '../common';
import { twilioAuth } from '../..';

export const twilioGetMessage = createAction({
  auth: twilioAuth,
  name: 'get_message',
  description: 'Retrieves the details of a specific message.',
  displayName: 'Get Message',
  props: {
    message_sid: Property.ShortText({
      displayName: 'Message SID',
      description: 'The unique identifier (SID) of the message to retrieve. It starts with "SM" or "MM".',
      required: true,
    }),
  },
  async run(context) {
    const { message_sid } = context.propsValue;
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;

    const path = `Messages/${message_sid}.json`;

    const response =  await callTwilioApi(
      HttpMethod.GET,
      path,
      { account_sid, auth_token }
    );

    return response.body;
  },
});
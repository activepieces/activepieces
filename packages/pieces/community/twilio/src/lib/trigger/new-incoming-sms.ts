import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpResponse,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { callTwilioApi, twilioCommon } from '../common';
import { twilioAuth } from '../..';

export const twilioNewIncomingSms = createTrigger({
  auth: twilioAuth,
  name: 'new_incoming_sms',
  displayName: 'New Incoming SMS',
  description: 'Triggers when a new SMS message is received',
  props: {
    phone_number: twilioCommon.phone_number,
  },
  sampleData: {
    body: 'Hello',
    num_segments: '1',
    direction: 'inbound',
    from: '+12184191735',
    date_updated: 'Wed, 08 Feb 2023 01:40:51 +0000',
    price: null,
    error_message: null,
    uri: '/2010-04-01/Accounts/ACc0ea1238d61fe90d78a69a3de71d45619/Messages/SM8c3920d3f2ac481ba83e639a69dadd63.json',
    account_sid: 'ACc0ea716d61fe90d78a123a3de71d45619',
    num_media: '0',
    to: '+12184191735',
    date_created: 'Wed, 08 Feb 2023 01:40:50 +0000',
    status: 'failed',
    sid: 'SM8c3920d3f2ac481ba83e639a69dadd63',
    date_sent: 'Wed, 08 Feb 2023 01:40:51 +0000',
    messaging_service_sid: 'MG88e323e6a88ce67ba3bf12e1bcb7e0b8',
    error_code: 21211,
    price_unit: 'USD',
    api_version: '2010-04-01',
    subresource_uris: {
      media:
        '/2010-04-01/Accounts/ACc0ea716d61fe90d78a69a3de71d45619/Messages/SM8c3920d3f2ac481ba83e639a69dadd63/Media.json',
      feedback:
        '/2010-04-01/Accounts/ACc0ea716d61fe90d78a69a3de71d45619/Messages/SM8c3920d3f2ac481ba83e639a69dadd63/Feedback.json',
    },
  },
  // Twilio API only allows one webhook per phone number, so we need to poll
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const { phone_number } = context.propsValue;
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;
    const response = await callTwilioApi<MessagePaginationResponse>(
      HttpMethod.GET,
      `Messages.json?PageSize=20&To=${phone_number}`,
      { account_sid, auth_token },
      {}
    );
    await context.store.put<LastMessage>('_new_incoming_sms_trigger', {
      lastMessageId:
        response.body.messages.length === 0
          ? null
          : response.body.messages[0].sid,
    });
  },
  async onDisable(context) {
    await context.store.put('_new_incoming_sms_trigger', null);
  },
  async run(context) {
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;
    const newMessages: unknown[] = [];
    const lastMessage = await context.store.get<LastMessage>(
      '_new_incoming_sms_trigger'
    );
    let currentUri:
      | string
      | null = `2010-04-01/Accounts/${account_sid}/Messages.json?PageSize=20&To=${context.propsValue.phone_number}`;
    let firstMessageId = undefined;
    while (currentUri !== undefined && currentUri !== null) {
      const res: HttpResponse<MessagePaginationResponse> =
        await httpClient.sendRequest<MessagePaginationResponse>({
          method: HttpMethod.GET,
          url: `https://api.twilio.com/${currentUri}`,
          authentication: {
            type: AuthenticationType.BASIC,
            username: account_sid,
            password: auth_token,
          },
        });
      const messages = res.body.messages;
      if (!firstMessageId && messages.length > 0) {
        firstMessageId = messages[0].sid;
      }
      currentUri = res.body.next_page_uri;
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        if (message.sid === lastMessage?.lastMessageId) {
          currentUri = null;
          break;
        }
        if (message.direction === 'inbound') {
          newMessages.push(message);
        }
      }
    }
    await context.store.put<LastMessage>('_new_incoming_sms_trigger', {
      lastMessageId: firstMessageId ?? lastMessage!.lastMessageId,
    });
    return newMessages;
  },
});

interface LastMessage {
  lastMessageId: string | null;
}

interface MessagePaginationResponse {
  messages: { sid: string; to: string; status: string; direction: string }[];
  next_page_uri: string;
}

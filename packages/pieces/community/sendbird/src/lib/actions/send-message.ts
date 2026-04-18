import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { sendbirdAuth, SendbirdAuthValue } from '../auth';

export const sendMessage = createAction({
  name: 'send_message',
  auth: sendbirdAuth,
  displayName: 'Send Message',
  description: 'Send a message to a channel in Sendbird',
  props: {
    channelType: Property.StaticDropdown({
      displayName: 'Channel Type',
      description: 'Type of the channel',
      required: true,
      options: {
        options: [
          { label: 'Open Channel', value: 'open_channels' },
          { label: 'Group Channel', value: 'group_channels' },
        ],
      },
    }),
    channelUrl: Property.ShortText({
      displayName: 'Channel URL',
      description: 'The URL of the channel to send the message to',
      required: true,
    }),
    messageType: Property.StaticDropdown({
      displayName: 'Message Type',
      description: 'Type of the message',
      required: true,
      options: {
        options: [
          { label: 'MESG (User Message)', value: 'MESG' },
          { label: 'FILE (File Message)', value: 'FILE' },
          { label: 'ADMM (Admin Message)', value: 'ADMM' },
        ],
      },
      defaultValue: 'MESG',
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The content of the message',
      required: true,
    }),
    senderId: Property.ShortText({
      displayName: 'Sender User ID',
      description: 'The user ID of the sender',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { appId, apiToken } = auth as SendbirdAuthValue;
    const { channelType, channelUrl, messageType, message, senderId } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api-${appId}.sendbird.com/v3/${channelType}/${channelUrl}/messages`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: apiToken,
      },
      body: {
        message_type: messageType,
        message: message,
        user_id: senderId,
      },
    });

    return response.body;
  },
});

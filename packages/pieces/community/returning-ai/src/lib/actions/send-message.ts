import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getApiEndpoint } from '../common';

export const sendMessage = createAction({
  name: 'sendMessage',
  displayName: 'Send Channel Message',
  description: 'Posts a message to a specified channel as a chosen user',
  props: {
    description: Property.MarkDown({
      value:
        'This action allows you to send messages to any accessible channel as a specific user. The message will appear as if the selected user posted it directly.',
    }),
    user: Property.ShortText({
      displayName: 'Sender (Username or email)',
      description: 'The user account that will send the message',
      required: true,
    }),
    channel: Property.Dropdown({
      displayName: 'Channel',
      description: 'The channel where the message will be posted',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        const authToken = auth as string;

        if (!authToken) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${getApiEndpoint(authToken)}/apis/v1/channels`,
          headers: {
            Authorization: `Bearer ${authToken.split(':')[1]}`,
          },
        });

        if (response.body.status === 'success') {
          return {
            options: response.body.data.map(
              (channel: { _id: string; topic: string }) => ({
                label: channel.topic,
                value: channel._id,
              })
            ),
          };
        } else {
          return {
            disabled: true,
            options: [],
            placeholder: response.body.message,
          };
        }
      },
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The message to be posted',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const authToken = auth as string;
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${getApiEndpoint(authToken)}/apis/v1/messages`,
      headers: {
        Authorization: `Bearer ${authToken.split(':')[1]}`,
      },
      body: {
        channelId: propsValue.channel,
        message: propsValue.message,
        sender: propsValue.user,
      },
    });

    return response.body;
  },
});

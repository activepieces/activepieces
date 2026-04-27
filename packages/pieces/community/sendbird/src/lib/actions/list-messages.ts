import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { sendbirdAuth, SendbirdAuthValue } from '../auth';

export const listMessages = createAction({
  name: 'list_messages',
  auth: sendbirdAuth,
  displayName: 'List Messages',
  description: 'List messages in a Sendbird channel',
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
      description: 'The URL of the channel to list messages from',
      required: true,
    }),
    messageTs: Property.ShortText({
      displayName: 'Message Timestamp',
      description: 'Timestamp to retrieve messages sent before (Unix timestamp in milliseconds). Leave empty for latest messages.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of messages to retrieve (default: 20, max: 200)',
      required: false,
      defaultValue: 20,
    }),
  },
  async run({ propsValue, auth }) {
    const { appId, apiToken } = auth as SendbirdAuthValue;
    const { channelType, channelUrl, messageTs, limit } = propsValue;

    const queryParams: Record<string, string> = {
      limit: String(Math.min(limit || 20, 200)),
    };

    if (messageTs) {
      queryParams.message_ts = messageTs;
    }

    const queryString = new URLSearchParams(queryParams).toString();

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api-${appId}.sendbird.com/v3/${channelType}/${channelUrl}/messages?${queryString}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: apiToken,
      },
    });

    return response.body;
  },
});

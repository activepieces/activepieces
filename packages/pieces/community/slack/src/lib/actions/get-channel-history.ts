import { ConversationsHistoryResponse, WebClient } from '@slack/web-api';
import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../..';
import { singleSelectChannelInfo, slackChannel } from '../common/props';

export const getChannelHistory = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getChannelHistory',
  auth: slackAuth,
  displayName: 'Get channel history',
  description:
    'Retrieve all messages from a specific channel ("conversation") between specified timestamps',
  props: {
    info: singleSelectChannelInfo,
    channel: slackChannel(true),
    oldest: Property.Number({
      displayName: 'Oldest',
      description:
        'Only messages after this timestamp will be included in results',
      required: false,
    }),
    latest: Property.Number({
      displayName: 'Latest',
      description:
        'Only messages before this timestamp will be included in results. Default is the current time',
      required: false,
    }),
    inclusive: Property.Checkbox({
      displayName: 'Inclusive',
      description:
        'Include messages with oldest or latest timestamps in results. Ignored unless either timestamp is specified',
      defaultValue: false,
      required: true,
    }),
    includeAllMetadata: Property.Checkbox({
      displayName: 'Include all metadata',
      description: 'Return all metadata associated with each message',
      defaultValue: false,
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(auth.access_token);
    const messages = [];
    await client.conversations.history({ channel: propsValue.channel });
    for await (const page of client.paginate('conversations.history', {
      channel: propsValue.channel,
      oldest: propsValue.oldest,
      latest: propsValue.latest,
      limit: 200, // page size, does not limit the total number of results
      include_all_metadata: propsValue.includeAllMetadata,
      inclusive: propsValue.inclusive,
    })) {
      const response = page as ConversationsHistoryResponse;
      if (response.messages) {
        messages.push(...response.messages);
      }
    }
    return messages;
  },
});

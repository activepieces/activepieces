import { slackAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { slackChannel, slackInfo } from '../common/props';

import { WebClient } from '@slack/web-api';
import { processMessageTimestamp } from '../common/utils';

export const addRectionToMessageAction = createAction({
  auth: slackAuth,
  name: 'slack-add-reaction-to-message',
  displayName: 'Add Reaction to Message',
  description: 'Add an emoji reaction to a message.',

  props: {
    info: slackInfo,
    channel: slackChannel,
    ts: Property.ShortText({
      displayName: 'Message Timestamp',
      description:
        'Please provide the timestamp of the message you wish to react, such as `1710304378.475129`. Alternatively, you can easily obtain the message link by clicking on the three dots next to the message and selecting the `Copy link` option.',
      required: true,
    }),
    reaction: Property.ShortText({
      displayName: 'Reaction (emoji) name',
      required: true,
      description: 'e.g.`thumbsup`',
    }),
  },

  async run(context) {
    const { channel, ts, reaction } = context.propsValue;

    const slack = new WebClient(context.auth.access_token);

    const messageTimestamp = processMessageTimestamp(ts);

    if (messageTimestamp) {
      const response = await slack.reactions.add({
        channel,
        timestamp: messageTimestamp,
        name: reaction,
      });

      return response;
    } else {
      throw new Error('Invalid Timestamp Value.');
    }
  },
});

import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { singleSelectChannelInfo, slackChannel } from '../common/props';

import { WebClient } from '@slack/web-api';
import { processMessageTimestamp } from '../common/utils';
import {
  getBotToken,
  getUserToken,
  requireUserToken,
  SlackAuthValue,
} from '../common/auth-helpers';

export const addRectionToMessageAction = createAction({
  auth: slackAuth,
  name: 'slack-add-reaction-to-message',
  classification: 'WRITE',
  displayName: 'Add Reaction to Message',
  description: 'Add an emoji reaction to a message.',
  audience: 'human',
  aiMetadata: { description: 'Add an emoji reaction to a specific message identified by its channel and timestamp, optionally reacting as the authenticated user instead of the bot. Adding the same reaction twice has no extra effect (Slack returns an already-reacted error), so the end state is stable. Provide the emoji name without colons, e.g. thumbsup.', idempotent: true },

  props: {
    info: singleSelectChannelInfo,
    channel: slackChannel(true),
    ts: Property.ShortText({
      displayName: 'Message Timestamp',
      description:
        'Timestamp of the target message, from its link or a trigger output.',
      placeholder: '1710304378.475129',
      required: true,
    }),
    reaction: Property.ShortText({
      displayName: 'Emoji',
      description: 'Emoji name without colons.',
      placeholder: 'thumbsup',
      required: true,
    }),
    reactAsUser: Property.Checkbox({
      displayName: 'React as User',
      description:
        'Add the reaction as the connected user instead of the bot.',
      required: false,
      defaultValue: false,
    }),
  },

  async run(context) {
    const { channel, ts, reaction, reactAsUser } = context.propsValue;

    const token = reactAsUser
      ? requireUserToken(context.auth as SlackAuthValue)
      : getBotToken(context.auth as SlackAuthValue);

    const slack = new WebClient(token);

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

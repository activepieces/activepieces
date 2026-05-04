import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { autoAddBot, singleSelectChannelInfo, slackChannel } from '../common/props';
import { WebClient } from '@slack/web-api';
import { processMessageTimestamp, tryAddBotToChannel } from '../common/utils';
import {
  getBotToken,
  getUserToken,
  requireUserToken,
  SlackAuthValue,
} from '../common/auth-helpers';

export const addRectionToMessageAction = createAction({
  auth: slackAuth,
  name: 'slack-add-reaction-to-message',
  displayName: 'Add Reaction to Message',
  description: 'Add an emoji reaction to a message.',

  props: {
    info: singleSelectChannelInfo,
    channel: slackChannel(true),
    autoAddBot,
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
    reactAsUser: Property.Checkbox({
      displayName: 'React as user?',
      description:
        'If enabled, the reaction will be added as the authenticated user instead of the bot.',
      required: true,
      defaultValue: false,
    }),
  },

  async run(context) {
    const { channel, ts, reaction, reactAsUser, autoAddBot: shouldAddBot } = context.propsValue;

    const botToken = getBotToken(context.auth as SlackAuthValue);
    const token = reactAsUser
      ? requireUserToken(context.auth as SlackAuthValue)
      : botToken;

    if (shouldAddBot) {
      await tryAddBotToChannel({
        botToken,
        userToken: getUserToken(context.auth as SlackAuthValue),
        channel,
      });
    }

    const slack = new WebClient(token);
    const messageTimestamp = processMessageTimestamp(ts);

    if (messageTimestamp) {
      return await slack.reactions.add({
        channel,
        timestamp: messageTimestamp,
        name: reaction,
      });
    } else {
      throw new Error('Invalid Timestamp Value.');
    }
  },
});

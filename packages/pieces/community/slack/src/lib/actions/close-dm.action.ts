import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const closeDmAction = createAction({
  auth: slackAuth,
  name: 'slack_close_dm',
  displayName: 'Close Direct Message',
  description: 'Closes a direct message or group DM conversation.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Close a direct message (IM) or group DM (MPIM) conversation view. Idempotent: closing an already-closed conversation succeeds without changing anything. This only hides the conversation from the sidebar; it does not delete any messages. Use the conversation ID returned when the DM was opened.',
    idempotent: true,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Conversation',
      description:
        "Direct message conversation ID to close, e.g. 'D0123456789' (IM) or 'G0123456789' (group DM). This is the conversation ID returned when the DM was opened, not a user ID.",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    return await client.conversations.close({
      channel: propsValue.channel,
    });
  },
});

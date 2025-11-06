import { createAction, Property } from '@activepieces/pieces-framework';
import { slackSendMessage } from '../common/utils';
import { slackAuth } from '../../';
import { assertNotNullOrUndefined } from '@activepieces/shared';
import {
  profilePicture,
  text,
  userId,
  username,
  blocks,
  mentionOriginFlow,
} from '../common/props';
import { Block,KnownBlock } from '@slack/web-api';


export const slackSendDirectMessageAction = createAction({
  auth: slackAuth,
  name: 'send_direct_message',
  displayName: 'Send Message To A User',
  description: 'Send message to a user',
  props: {
    userId,
    text,
    username,
    profilePicture,
    mentionOriginFlow,
    blocks,
    unfurlLinks: Property.Checkbox({
      displayName: 'Unfurl Links',
      description: 'Enable link unfurling for this message',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { text, userId, blocks, unfurlLinks, mentionOriginFlow } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(text, 'text');
    assertNotNullOrUndefined(userId, 'userId');

    const blockList: (KnownBlock | Block)[] = [{ type: 'section', text: { type: 'mrkdwn', text } }]

    if(blocks && Array.isArray(blocks)) { 
      blockList.push(...(blocks as unknown as (KnownBlock | Block)[]))
    }

    if(mentionOriginFlow) {
      (blockList as KnownBlock[])?.push({ type: 'context', elements: [
        {
          "type": "mrkdwn",
          "text": `Message sent by <${new URL(context.server.publicUrl).origin}/projects/${context.project.id}/flows/${context.flows.current.id}|this flow>.`
        }
      ] })
    }

    return slackSendMessage({
      token,
      text,
      username: context.propsValue.username,
      profilePicture: context.propsValue.profilePicture,
      conversationId: userId,
      blocks:blockList,
      unfurlLinks,
    });
  },
});


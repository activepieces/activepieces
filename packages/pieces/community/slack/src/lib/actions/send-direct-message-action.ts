import { createAction } from '@activepieces/pieces-framework'
import { assertNotNullOrUndefined } from '@activepieces/shared'
import { Block, KnownBlock } from '@slack/web-api'
import { slackAuth } from '../../'
import { blocks, profilePicture, text, userId, username } from '../common/props'
import { slackSendMessage } from '../common/utils'

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
    blocks,
  },
  async run(context) {
    const token = context.auth.access_token
    const { text, userId, blocks } = context.propsValue

    assertNotNullOrUndefined(token, 'token')
    assertNotNullOrUndefined(text, 'text')
    assertNotNullOrUndefined(userId, 'userId')

    const blockList = blocks
      ? [{ type: 'section', text: { type: 'mrkdwn', text } }, ...(blocks as unknown as (KnownBlock | Block)[])]
      : undefined

    return slackSendMessage({
      token,
      text,
      username: context.propsValue.username,
      profilePicture: context.propsValue.profilePicture,
      conversationId: userId,
      blocks: blockList,
    })
  },
})

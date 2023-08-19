import { createAction, Property } from '@activepieces/pieces-framework'
import { profilePicture, slackChannel, username } from '../common/props'
import { slackSendMessage } from '../common/utils'
import { slackAuth } from "../../";

export const slackSendMessageAction = createAction({
  auth: slackAuth,
    name: 'send_channel_message',
    displayName: 'Send Message To A Channel',
    description: 'Send message to a channel',
    props: {
      channel: slackChannel,
      text: Property.LongText({
        displayName: 'Message',
        description: 'The text of your message',
        required: true,
      }),
      username,
      profilePicture,
    },
    async run(context) {
      const token = context.auth.access_token
      const { text, channel } = context.propsValue

      return slackSendMessage({
        token,
        text,
        username: context.propsValue.username,
        profilePicture: context.propsValue.profilePicture,
        conversationId: channel,
      })
    },
})

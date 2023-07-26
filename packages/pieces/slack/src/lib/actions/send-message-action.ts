import { createAction, Property } from '@activepieces/pieces-framework'
import { ProfilePicture, slackChannel, Username } from '../common/props'
import { slackSendMessage } from '../common/utils'
import { slackAuth } from "../../";

export const slackSendMessageAction = createAction({
  auth: slackAuth,
    name: 'send_channel_message',
    displayName: 'Send Message To A Channel',
    description: 'Send message to a channel',
    sampleData: {
      success: true,
      message: 'sample message',
      results: [1, 2, 3, 4],
    },
    props: {
      channel: slackChannel,
      text: Property.LongText({
        displayName: 'Message',
        description: 'The text of your message',
        required: true,
      }),
      Username,
      ProfilePicture,
    },
    async run(context) {
      const token = context.auth.access_token
      const { text, channel } = context.propsValue

      return slackSendMessage({
        token,
        text,
        username: context.propsValue.Username,
        profilePicture: context.propsValue.ProfilePicture,
        conversationId: channel,
      })
    },
})

import {
  createAction,
  Property,
} from '@activepieces/framework'
import { assertNotNullOrUndefined } from '@activepieces/pieces-common'
import { slackAuth, slackChannel } from '../common/props'
import { slackSendMessage } from '../common/utils'

export const slackSendMessageAction = createAction({
  name: 'send_channel_message',
  displayName: 'Send Message To A Channel',
  description: 'Send message to a channel',
  sampleData: {
    success: true,
    message: 'sample message',
    results: [1, 2, 3, 4],
  },
  props: {
    authentication: slackAuth,
    channel: slackChannel,
    text: Property.LongText({
      displayName: 'Message',
      description: 'The text of your message',
      required: true,
    }),
  },
  async run(context) {
    const token = context.propsValue.authentication?.access_token
    const { text, channel } = context.propsValue

    assertNotNullOrUndefined(token, 'token')
    assertNotNullOrUndefined(text, 'text')
    assertNotNullOrUndefined(channel, 'channel')

    return slackSendMessage({
      token,
      text,
      conversationId: channel,
    })
  },
})

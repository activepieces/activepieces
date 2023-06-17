import {
  Property,
} from '@activepieces/pieces-framework'
import { slackChannel } from '../common/props'
import { slackSendMessage } from '../common/utils'
import { slack } from "../../";

slack.addAction({
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
  },
  async run(context) {
    const token = context.auth.access_token
    const { text, channel } = context.propsValue

    return slackSendMessage({
      token,
      text,
      conversationId: channel,
    })
  },
})

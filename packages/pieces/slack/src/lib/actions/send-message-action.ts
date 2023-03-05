import {
  assertNotNullOrUndefined,
  AuthenticationType,
  createAction,
  httpClient,
  HttpMethod,
  HttpRequest,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/framework'
import { slackAuth } from '../common/props'
import { slackSendMessage } from '../common/utils'

export const slackSendMessageAction = createAction({
  name: 'send_channel_message',
  displayName: 'Send message to a channel',
  description: 'Send message to a channel',
  sampleData: {
    success: true,
    message: 'sample message',
    results: [1, 2, 3, 4],
  },
  props: {
    authentication: slackAuth,
    channel: Property.Dropdown({
      displayName: 'Channel',
      description: 'Channel, private group, or IM channel to send message to.',
      required: true,
      refreshers: ['authentication'],
      async options(value) {
        if (!value['authentication']) {
          return {
            disabled: true,
            placeholder: 'connect slack account',
            options: [],
          }
        }
        const authentication: OAuth2PropertyValue = value[
          'authentication'
        ] as OAuth2PropertyValue
        const accessToken = authentication['access_token']
        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: `https://slack.com/api/conversations.list?types=public_channel,private_channel`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: accessToken,
          },
        }
        const response = await httpClient.sendRequest<{
          channels: { id: string; name: string }[]
        }>(request)
        return {
          disabled: false,
          placeholder: 'Select channel',
          options: response.body.channels.map((ch) => {
            return {
              label: ch.name,
              value: ch.id,
            }
          }),
        }
      },
    }),
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

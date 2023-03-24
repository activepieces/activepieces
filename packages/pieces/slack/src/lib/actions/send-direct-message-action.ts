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

export const slackSendDirectMessageAction = createAction({
  name: 'send_direct_message',
  displayName: 'Send Message To A User',
  description: 'Send message to a user',
  sampleData: {
    success: true,
    message: 'sample message',
    results: [1, 2, 3, 4],
  },
  props: {
    authentication: slackAuth,
    userId: Property.Dropdown<string>({
      displayName: 'User',
      description: 'Message receiver',
      required: true,
      refreshers: ['authentication'],
      async options(propsValue) {
        const auth = propsValue['authentication'] as OAuth2PropertyValue

        if (!auth) {
          return {
            disabled: true,
            placeholder: 'connect slack account',
            options: [],
          }
        }

        const accessToken = auth.access_token

        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: 'https://slack.com/api/users.list',
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: accessToken,
          },
        }

        const response = await httpClient.sendRequest<UserListResponse>(request)

        const options = response.body.members.map(member => ({
          label: member.name,
          value: member.id,
        }))

        return {
          disabled: false,
          placeholder: 'Select channel',
          options,
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
    const { text, userId } = context.propsValue

    assertNotNullOrUndefined(token, 'token')
    assertNotNullOrUndefined(text, 'text')
    assertNotNullOrUndefined(userId, 'userId')

    return slackSendMessage({
      token,
      text,
      conversationId: userId,
    })
  },
})

type UserListResponse = {
  members: {
    id: string
    name: string
  }[]
}

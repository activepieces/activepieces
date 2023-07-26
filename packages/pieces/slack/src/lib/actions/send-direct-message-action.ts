import {
  OAuth2PropertyValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework'
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common'
import { slackSendMessage } from '../common/utils'
import { slackAuth } from "../../";
import { assertNotNullOrUndefined } from '@activepieces/shared';
import { ProfilePicture, Username } from '../common/props';

export const slackSendDirectMessageAction = createAction({
  auth: slackAuth,
    name: 'send_direct_message',
    displayName: 'Send Message To A User',
    description: 'Send message to a user',
    sampleData: {
      success: true,
      message: 'sample message',
      results: [1, 2, 3, 4],
    },
    props: {
      userId: Property.Dropdown<string>({
        displayName: 'User',
        description: 'Message receiver',
        required: true,
        refreshers: [],
        async options({ auth }) {
          if (!auth) {
            return {
              disabled: true,
              placeholder: 'connect slack account',
              options: [],
            }
          }

          const accessToken = (auth as OAuth2PropertyValue).access_token

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
      Username,
      ProfilePicture,
    },
    async run(context) {
      const token = context.auth.access_token
      const { text, userId } = context.propsValue

      assertNotNullOrUndefined(token, 'token')
      assertNotNullOrUndefined(text, 'text')
      assertNotNullOrUndefined(userId, 'userId')

      return slackSendMessage({
        token,
        text,
        username: context.propsValue.Username,
        profilePicture: context.propsValue.ProfilePicture,
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

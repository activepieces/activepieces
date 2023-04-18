import { OAuth2PropertyValue, Property } from "@activepieces/pieces-framework";
import { AuthenticationType, httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";

export const slackAuth = Property.OAuth2({
  description: '',
  displayName: 'Authentication',
  authUrl: 'https://slack.com/oauth/authorize',
  tokenUrl: 'https://slack.com/api/oauth.access',
  required: true,
  scope: [
    'channels:read',
    'channels:write',
    'channels:history',
    'chat:write:bot',
    'groups:read',
    'reactions:read',
    'mpim:read',
    'users:read',
  ],
})

export const slackChannel = Property.Dropdown({
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
});
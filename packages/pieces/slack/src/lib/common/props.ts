import { OAuth2PropertyValue, Property } from "@activepieces/pieces-framework";
import { AuthenticationType, httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";

export const slackChannel = Property.Dropdown({
  displayName: 'Channel',
  description: 'Channel, private group, or IM channel to send message to.',
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
    const authentication = auth as OAuth2PropertyValue
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

export const username = Property.ShortText({
  displayName: 'Username',
  description: 'The username of the bot',
  required: false,
});

export const profilePicture = Property.ShortText({
  displayName: 'Profile Picture',
  description: 'The profile picture of the bot',
  required: false,
});
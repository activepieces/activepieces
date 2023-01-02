import { AuthenticationType } from '../../../common/authentication/core/authentication-type';
import { HttpMethod } from '../../../common/http/core/http-method';
import type { HttpRequest } from '../../../common/http/core/http-request';
import { createAction } from '../../../framework/action/action';
import { httpClient } from '../../../common/http/core/http-client';
import {
  AuthPropertyValue,
  Property,
} from '../../../framework/property/prop.model';

export const slackSendMessageAction = createAction({
  name: 'send_channel_message',
  displayName: 'Send Slack Message',
  description: 'Send Slack Message',
  props: {
    authentication: Property.OAuth2({
      description: '',
      displayName: 'Authentication',
      authUrl: 'https://slack.com/oauth/authorize',
      tokenUrl: 'https://slack.com/api/oauth.access',
      required: true,
      scope: ['channels:read', 'channels:write', 'chat:write:bot'],
    }),
    channel: Property.Dropdown({
      displayName: 'Channel',
      description:
        'Channel, private group, or IM channel to send message to. Can be an encoded ID, or a name. See [below](#channels) for more details.',
      required: true,
      refreshers: ['authentication'],
      async options(value) {
        if (value['authentication'] === undefined) {
          return {
            disabled: true,
            placeholder: 'connect slack account',
            options: [],
          };
        }
        const authentication: AuthPropertyValue = value[
          'authentication'
        ] as AuthPropertyValue;
        const accessToken = authentication['access_token'];
        const request: HttpRequest<never> = {
          method: HttpMethod.GET,
          url: `https://slack.com/api/conversations.list`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: accessToken,
          },
        };
        const response = await httpClient.sendRequest<{
          channels: { id: string; name: string }[];
        }>(request);
        return {
          disabled: false,
          placeholder: 'Select channel',
          options: response.channels.map((ch) => {
            return {
              label: ch.name,
              value: ch.id,
            };
          }),
        };
      },
    }),
    text: Property.LongText({
      displayName: 'Message',
      description: 'The text of your message',
      required: true,
    }),
  },
  async run(context) {
    let configValue = context.propsValue;
    let body: Record<string, unknown> = {
      text: configValue['text'],
      channel: configValue['channel'],
    };
    const request: HttpRequest<Record<string, unknown>> = {
      method: HttpMethod.POST,
      url: 'https://slack.com/api/chat.postMessage',
      body: body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: configValue['authentication']!['access_token'],
      },
      queryParams: {},
    };

    let result = await httpClient.sendRequest(request);

    return {
      success: true,
      request_body: body,
      response_body: result,
    };
  },
});

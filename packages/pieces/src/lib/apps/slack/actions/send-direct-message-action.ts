import { AuthenticationType } from "../../../common/authentication/core/authentication-type";
import { assertNotNullOrUndefined } from "../../../common/helpers/assertions";
import { httpClient } from "../../../common/http/core/http-client";
import { HttpMethod } from "../../../common/http/core/http-method";
import { HttpRequest } from "../../../common/http/core/http-request";
import { createAction } from "../../../framework/action/action";
import { OAuth2PropertyValue, Property } from "../../../framework/property";
import { slackAuthWithScopes } from "../common/props";
import { slackSendMessage } from "../common/utils";

export const slackSendDirectMessageAction = createAction({
  name: 'send_direct_message',
  displayName: 'Send direct message',
  description: 'Send direct message',
  sampleData: {
    success: true,
    message: 'sample message',
    results: [1, 2, 3, 4],
  },
  props: {
    authentication: slackAuthWithScopes(
      'chat:write:bot',
      'users:read',
    ),
    userId: Property.Dropdown<string>({
      displayName: 'User',
      description: 'Message receiver',
      required: true,
      refreshers: ['authentication'],
      async options(propsValue) {
        const auth = propsValue['authentication'] as OAuth2PropertyValue;

        if (auth === undefined) {
          return {
            disabled: true,
            placeholder: 'connect slack account',
            options: [],
          };
        }

        const accessToken = auth.access_token;

        const request: HttpRequest<never> = {
          method: HttpMethod.GET,
          url: 'https://slack.com/api/users.list',
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: accessToken,
          },
        };

        const response = await httpClient.sendRequest<UserListResponse>(request);

        const options = response.body.members.map(member => ({
          label: member.name,
          value: member.id,
        }));

        return {
          disabled: false,
          placeholder: 'Select channel',
          options,
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
    const token = context.propsValue.authentication?.access_token;
    const { text, userId } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(text, 'text');
    assertNotNullOrUndefined(userId, 'userId');

    return slackSendMessage({
      token,
      text,
      channel: userId,
    });
  },
});

type UserListResponse = {
  members: {
    id: string;
    name: string;
  }[];
}

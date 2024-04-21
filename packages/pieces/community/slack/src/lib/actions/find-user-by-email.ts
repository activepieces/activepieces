import { slackAuth } from '../../';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

export const findUserByEmailAction = createAction({
  auth: slackAuth,
  name: 'slack-find-user-by-email',
  displayName: 'Find User by Email',
  description: 'Finds a user by matching against thier email address.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
  },
  async run(context) {
    const email = context.propsValue.email;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: 'https://slack.com/api/users.lookupByEmail',
      queryParams: {
        email: email,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    };

    const response = await httpClient.sendRequest(request);

    if (!response.body.ok) {
      throw new Error(JSON.stringify(response.body, undefined, 2));
    }

    return response.body;
  },
});

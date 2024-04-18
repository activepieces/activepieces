import { slackAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export const updateProfileAction = createAction({
  auth: slackAuth,
  name: 'slack-update-profile',
  displayName: 'Update Profile',
  description: 'Update basic profile field such as name or title.',
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: `Changing a user's email address will send an email to both the old and new addresses, and also post a slackbot message to the user informing them of the change.`,
      required: false,
    }),
    userId: Property.ShortText({
      displayName: 'User',
      description:
        'ID of user to change. This argument may only be specified by admins on paid teams.You can use **Find User by Email** action to retrive ID.',
      required: false,
    }),
  },
  async run(context) {
    const firstName = context.propsValue.firstName;
    const lastName = context.propsValue.lastName;
    const email = context.propsValue.email;
    const userId = context.propsValue.userId;

    const userToken = context.auth.data['authed_user']?.access_token;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://slack.com/api/users.profile.set',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: userToken,
      },
      body: {
        profile: {
          first_name: firstName,
          last_name: lastName,
          email,
        },
        user: userId,
      },
    };

    const response = await httpClient.sendRequest(request);

    if (!response.body.ok) {
      throw new Error(JSON.stringify(response.body, undefined, 2));
    }

    return response.body;
  },
});

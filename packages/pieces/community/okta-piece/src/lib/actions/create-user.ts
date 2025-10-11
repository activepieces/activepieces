import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { oktaAuth } from '../../index';

export const createUser = createAction({
  auth: oktaAuth,
  name: 'create_user',
  displayName: 'Create User',
  description: 'Creates a new user in your Okta org with or without credentials',
  props: {
    activate: Property.Checkbox({
      displayName: 'Activate User',
      description: 'Executes an activation lifecycle operation when creating the user',
      required: false,
      defaultValue: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    login: Property.ShortText({
      displayName: 'Login',
      description: 'Unique identifier for the user (username). If not provided, email will be used.',
      required: false,
    }),
    mobilePhone: Property.ShortText({
      displayName: 'Mobile Phone',
      required: false,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Password for the user (optional)',
      required: false,
    }),
    recoveryQuestion: Property.ShortText({
      displayName: 'Recovery Question',
      required: false,
    }),
    recoveryAnswer: Property.ShortText({
      displayName: 'Recovery Answer',
      required: false,
    }),
    groupIds: Property.Array({
      displayName: 'Group IDs',
      description: 'List of group IDs to add the user to at creation',
      required: false,
    }),
  },
  async run(context) {
    const { domain, apiToken } = context.auth;
    const { activate, firstName, lastName, email, login, mobilePhone, password, recoveryQuestion, recoveryAnswer, groupIds } = context.propsValue;

    const body: any = {
      profile: {
        firstName,
        lastName,
        email,
        login: login || email,
      },
    };

    if (mobilePhone) {
      body.profile.mobilePhone = mobilePhone;
    }

    if (password || recoveryQuestion) {
      body.credentials = {};
    }

    if (password) {
      body.credentials.password = { value: password };
    }

    if (recoveryQuestion && recoveryAnswer) {
      body.credentials.recovery_question = {
        question: recoveryQuestion,
        answer: recoveryAnswer,
      };
    }

    if (groupIds && groupIds.length > 0) {
      body.groupIds = groupIds;
    }

    const url = `https://${domain}/api/v1/users?activate=${activate}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `SSWS ${apiToken}`,
      },
      body,
    });

    return response.body;
  },
});

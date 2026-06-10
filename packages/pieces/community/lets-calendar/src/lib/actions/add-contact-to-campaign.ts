import { createAction, Property } from '@activepieces/pieces-framework';
import { letsCalendarAuth } from '../common/auth';
import { getAccessToken, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const addContactToCampaign = createAction({
  auth: letsCalendarAuth,
  name: 'addContactToCampaign',
  displayName: 'Add Contact to Campaign',
  description: 'Add a single contact to a campaign',
  props: {
    campaign_id: Property.ShortText({
      displayName: 'Campaign ID',
      description: 'The unique identifier of the campaign',
      required: true,
    }),
    firstname: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the contact (max 150 characters)',
      required: true,
    }),
    lastname: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the contact (max 150 characters)',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'A valid email address (max 150 characters)',
      required: true,
    }),
    loginurl: Property.ShortText({
      displayName: 'Login URL',
      description: 'The login URL for the contact',
      required: false,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'The username for the contact',
      required: false,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'The password for the contact',
      required: false,
    }),
  },
  async run(context) {
    const accessToken = await getAccessToken(
      context.auth.props.client_key,
      context.auth.props.secret_key
    );

    const body: any = {
      campaign_id: context.propsValue.campaign_id,
      firstname: context.propsValue.firstname,
      email: context.propsValue.email,
    };

    // Add optional fields if provided
    if (context.propsValue.lastname) {
      body.lastname = context.propsValue.lastname;
    }
    if (context.propsValue.loginurl) {
      body.loginurl = context.propsValue.loginurl;
    }
    if (context.propsValue.username) {
      body.username = context.propsValue.username;
    }
    if (context.propsValue.password) {
      body.password = context.propsValue.password;
    }

    const response = await makeRequest(
      accessToken,
      HttpMethod.POST,
      '/add-single-contact',
      body
    );

    return response;
  },
});

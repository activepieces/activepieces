import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { brilliantDirectoriesAuth } from '../..';
import { parseDirectoryURL } from '../common/brilliant-directories-common';

export const createNewUser = createAction({
  name: 'create_new_user',
  auth: brilliantDirectoriesAuth,
  displayName: 'Create new User',
  description: 'Creates a new user in your brilliant directories site',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address for the users account',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Password for the new user account',
      required: true,
    }),
    subscription: Property.ShortText({
      displayName: 'Subscription ID',
      description: 'The subscription ID from your website',
      required: true,
    }),
    meta: Property.Json({
      displayName: 'Meta',
      description: 'Additional fields for the new user account',
      required: false,
    }),
  },

  async run(context) {
    const siteUrl = parseDirectoryURL(context.auth.site_url);

    // Compile the request
    const CREATE_NEW_USER_URL = siteUrl + '/v2/user/create';
    const headers = {
      accept: 'application/json',
      'X-Api-Key': context.auth.api_key,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    const body = {
      email: context.propsValue.email,
      password: context.propsValue.password,
      subscription_id: context.propsValue.subscription,
      ...context.propsValue.meta,
    };

    // send the request
    const request = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: CREATE_NEW_USER_URL,
      headers: headers,
      body: body,
    });

    // return the request
    return request;
  },
});

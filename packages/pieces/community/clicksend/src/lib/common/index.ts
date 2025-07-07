import {
  Property,
  BasicAuthPropertyValue,
} from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpMessageBody,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const clicksendCommon = {
  phone_number: Property.ShortText({
    description: 'The phone number (with country code, e.g., +1234567890)',
    displayName: 'Phone Number',
    required: true,
  }),
  
  email: Property.ShortText({
    description: 'The email address',
    displayName: 'Email Address',
    required: true,
  }),

  contact_list_id: Property.Number({
    description: 'The ID of the contact list',
    displayName: 'Contact List ID',
    required: true,
  }),

  contact_id: Property.Number({
    description: 'The ID of the contact',
    displayName: 'Contact ID',
    required: true,
  }),
};

export const callClickSendApi = async <T extends HttpMessageBody>(
  method: HttpMethod,
  path: string,
  auth: { username: string; password: string },
  body?: any
) => {
  return await httpClient.sendRequest<T>({
    method,
    url: `https://rest.clicksend.com/v3/${path}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.username,
      password: auth.password,
    },
    headers: {
      'Content-Type': 'application/json',
    },
    body: body,
  });
}; 
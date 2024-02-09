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

export const twilioCommon = {
  phone_number: Property.Dropdown({
    description: 'The phone number to send the message from',
    displayName: 'From',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'connect your account first',
          options: [],
        };
      }

      const basicAuthProperty = auth as BasicAuthPropertyValue;
      const response = await callTwilioApi<{
        incoming_phone_numbers: {
          phone_number: string;
          friendly_name: string;
        }[];
      }>(HttpMethod.GET, 'IncomingPhoneNumbers.json', {
        account_sid: basicAuthProperty.username,
        auth_token: basicAuthProperty.password,
      });
      return {
        disabled: false,
        options: response.body.incoming_phone_numbers.map((number: any) => ({
          value: number.phone_number,
          label: number.friendly_name,
        })),
      };
    },
  }),
};

export const callTwilioApi = async <T extends HttpMessageBody>(
  method: HttpMethod,
  path: string,
  auth: { account_sid: string; auth_token: string },
  body?: any
) => {
  return await httpClient.sendRequest<T>({
    method,
    url: `https://api.twilio.com/2010-04-01/Accounts/${auth.account_sid}/${path}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.account_sid,
      password: auth.auth_token,
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body,
  });
};

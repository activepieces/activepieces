import {
  Property,
  tryCatch,
} from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { twilioAuth } from '../..';

export const twilioCommon = {
  phoneNumberDropdown: ({
    displayName,
    description,
  }: {
    displayName: string;
    description: string;
  }) =>
    Property.Dropdown({
      auth: twilioAuth,
      description,
      displayName,
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        const { data: phoneNumbers, error } = await tryCatch(() =>
          fetchAllIncomingPhoneNumbers({
            accountSid: auth.username,
            authToken: auth.password,
          })
        );

        if (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load phone numbers. Check your connection.',
          };
        }

        if (phoneNumbers.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder:
              'No phone numbers found. Buy one in the Twilio Console first.',
          };
        }

        return {
          disabled: false,
          options: phoneNumbers.map((phoneNumber) => ({
            value: phoneNumber.phone_number,
            label: buildPhoneNumberLabel(phoneNumber),
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

async function fetchAllIncomingPhoneNumbers({
  accountSid,
  authToken,
}: {
  accountSid: string;
  authToken: string;
}): Promise<IncomingPhoneNumber[]> {
  let nextUrl: string | null = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json?PageSize=1000`;
  const phoneNumbers: IncomingPhoneNumber[] = [];
  while (nextUrl !== null) {
    const response: HttpResponse<IncomingPhoneNumbersPage> =
      await httpClient.sendRequest<IncomingPhoneNumbersPage>({
        method: HttpMethod.GET,
        url: nextUrl,
        authentication: {
          type: AuthenticationType.BASIC,
          username: accountSid,
          password: authToken,
        },
      });
    phoneNumbers.push(...response.body.incoming_phone_numbers);
    const nextPageUri: string | null = response.body.next_page_uri;
    nextUrl = nextPageUri ? `https://api.twilio.com${nextPageUri}` : null;
  }
  return phoneNumbers;
}

function buildPhoneNumberLabel({
  phone_number,
  friendly_name,
}: IncomingPhoneNumber): string {
  if (!friendly_name) {
    return phone_number;
  }
  const friendlyNameDigits = friendly_name.replace(/\D/g, '');
  const phoneNumberDigits = phone_number.replace(/\D/g, '');
  if (
    PHONE_FORMAT_ONLY.test(friendly_name) &&
    friendlyNameDigits.length > 0 &&
    phoneNumberDigits.endsWith(friendlyNameDigits)
  ) {
    return friendly_name;
  }
  return `${friendly_name} (${phone_number})`;
}

const PHONE_FORMAT_ONLY = /^[\d\s()+.-]+$/;

type IncomingPhoneNumber = {
  phone_number: string;
  friendly_name: string;
};

type IncomingPhoneNumbersPage = {
  incoming_phone_numbers: IncomingPhoneNumber[];
  next_page_uri: string | null;
};

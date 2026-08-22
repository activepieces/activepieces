import { Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpMessageBody,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { plivoAuth } from '../..';

export const plivoCommon = {
  phone_number: Property.Dropdown({
    auth: plivoAuth,
    description: 'The Plivo number to send the message from',
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

      try {
        const numbers: PlivoNumber[] = [];
        const limit = 20;
        let offset = 0;
        for (;;) {
          const response = await callPlivoApi<NumberListResponse>(
            HttpMethod.GET,
            `Number/?limit=${limit}&offset=${offset}`,
            { auth_id: auth.username, auth_token: auth.password }
          );
          const page = response.body.objects ?? [];
          numbers.push(...page);
          offset += limit;
          if (page.length < limit || offset >= response.body.meta.total_count) {
            break;
          }
        }
        return {
          disabled: false,
          options: numbers.map((number) => ({
            value: number.number,
            label: number.alias
              ? `${number.number} (${number.alias})`
              : number.number,
          })),
        };
      } catch (e) {
        return {
          disabled: true,
          placeholder: 'could not load numbers, check your credentials',
          options: [],
        };
      }
    },
  }),
};

export const callPlivoApi = async <T extends HttpMessageBody>(
  method: HttpMethod,
  path: string,
  auth: { auth_id: string; auth_token: string },
  body?: unknown
) => {
  return await httpClient.sendRequest<T>({
    method,
    url: `https://api.plivo.com/v1/Account/${auth.auth_id}/${path}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.auth_id,
      password: auth.auth_token,
    },
    headers: {
      'Content-Type': 'application/json',
    },
    body: body,
  });
};

interface PlivoNumber {
  number: string;
  alias: string;
}

interface NumberListResponse {
  meta: { limit: number; offset: number; total_count: number };
  objects: PlivoNumber[];
}

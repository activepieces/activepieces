import { zuoraAuth } from '../../';
import {
  DropdownOption,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';

export async function queryAccounts(
  auth: PiecePropValueSchema<typeof zuoraAuth>
) {
  const token = await getAccessToken(auth);
  const result: Record<string, any>[] = [];
  let cursor;
  do {
    const qs: QueryParams = {
      pageSize: '50',
      'fields[]': 'id,name',
      'sort[]': 'updated_time.desc',
    };
    if (cursor) {
      qs['cursor'] = cursor;
    }

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${auth.environment}/v2/accounts`,
      queryParams: qs,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
    };

    const response = await httpClient.sendRequest(request);
    result.push(...response.body['data']);
    cursor = response.body['nextPage'];
  } while (cursor);

  return result;
}

export async function getAccessToken(
  auth: PiecePropValueSchema<typeof zuoraAuth>
): Promise<string> {
  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `${auth.environment}/oauth/token`,
    body: new URLSearchParams({
      client_id: auth.clientId,
      client_secret: auth.clientSecret,
      grant_type: 'client_credentials',
    }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  const response = await httpClient.sendRequest(request);
  return response.body['access_token'];
}

export const zuoraCommonProps = {
  account_id: (displayName: string, description: string, required: boolean) =>
    Property.Dropdown({
      displayName,
      description,
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        const authValue = auth as PiecePropValueSchema<typeof zuoraAuth>;
        const accounts = await queryAccounts(authValue);

        const options: DropdownOption<string>[] = [];

        for (const account of accounts) {
          options.push({
            label: account['name'] ?? account['id'],
            value: account['id'],
          });
        }

        return {
          disabled: false,
          options,
        };
      },
    }),
};

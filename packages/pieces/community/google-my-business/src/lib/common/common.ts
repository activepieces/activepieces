import {
  Property,
  DropdownOption,
  isNil,
  tryCatch,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { googleAuth } from '../..';
import { gmbApi } from './client';

export const googleBusinessCommon = {
  account: Property.Dropdown({
    displayName: 'Account',
    description: 'The Business Profile account that manages the location.',
    required: true,
    auth: googleAuth,
    refreshers: [],
    options: async ({ auth }) => {
      if (isNil(auth)) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }
      const accessToken = auth.access_token;
      const result = await tryCatch(() => listAccountOptions(accessToken));
      if (result.error !== null) {
        return {
          disabled: true,
          options: [],
          placeholder: gmbApi.dropdownErrorPlaceholder({
            error: result.error,
            fallback: 'Could not load accounts',
          }),
        };
      }
      if (result.data.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No Business Profile accounts found',
        };
      }
      return {
        disabled: false,
        options: result.data,
      };
    },
  }),
  location: Property.Dropdown({
    displayName: 'Location',
    description: 'The business listing on Google Search and Maps.',
    auth: googleAuth,
    required: true,
    refreshers: ['account'],
    options: async ({ auth, account }) => {
      if (isNil(auth)) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }
      if (typeof account !== 'string' || account.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select an account first',
        };
      }
      const accessToken = auth.access_token;
      const accountName = account;
      const result = await tryCatch(() =>
        listLocationOptions({ accessToken, account: accountName })
      );
      if (result.error !== null) {
        return {
          disabled: true,
          options: [],
          placeholder: gmbApi.dropdownErrorPlaceholder({
            error: result.error,
            fallback: 'Could not load locations',
          }),
        };
      }
      if (result.data.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No locations found in this account',
        };
      }
      return {
        disabled: false,
        options: result.data,
      };
    },
  }),
};

async function listAccountOptions(
  accessToken: string
): Promise<DropdownOption<string>[]> {
  const options: DropdownOption<string>[] = [];
  let nextPageToken: string | undefined;

  do {
    const qs: QueryParams = {
      pageSize: '20',
    };
    if (nextPageToken) {
      qs.pageToken = nextPageToken;
    }

    const response = await httpClient.sendRequest<{
      accounts?: { accountName: string; name: string }[];
      nextPageToken?: string;
    }>({
      url: `${gmbApi.hosts.accountManagement}/accounts`,
      queryParams: qs,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    });

    nextPageToken = response.body.nextPageToken;
    for (const account of response.body.accounts ?? []) {
      options.push({
        label: account.accountName,
        value: account.name,
      });
    }
  } while (nextPageToken);

  return options;
}

async function listLocationOptions({
  accessToken,
  account,
}: {
  accessToken: string;
  account: string;
}): Promise<DropdownOption<string>[]> {
  const options: DropdownOption<string>[] = [];
  let nextPageToken: string | undefined;

  do {
    const qs: QueryParams = {
      pageSize: '100',
      read_mask: 'title,name',
    };
    if (nextPageToken) {
      qs.pageToken = nextPageToken;
    }

    const response = await httpClient.sendRequest<{
      locations?: { title?: string; name: string }[];
      nextPageToken?: string;
    }>({
      url: `https://mybusinessbusinessinformation.googleapis.com/v1/${account}/locations`,
      queryParams: qs,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    });

    nextPageToken = response.body.nextPageToken;
    if (Array.isArray(response.body.locations)) {
      for (const location of response.body.locations) {
        options.push({
          label: isNil(location.title) || location.title.length === 0 ? location.name : location.title,
          value: location.name,
        });
      }
    }
  } while (nextPageToken);

  return options;
}

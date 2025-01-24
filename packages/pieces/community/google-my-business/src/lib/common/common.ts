import {
  Property,
  OAuth2PropertyValue,
  DropdownOption,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';

export const googleBusinessCommon = {
  account: Property.Dropdown({
    displayName: 'Account',
    required: true,
    refreshers: [],
    options: async (propsValue) => {
      if (!propsValue['auth']) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first',
        };
      }
      const authProp: OAuth2PropertyValue = propsValue[
        'auth'
      ] as OAuth2PropertyValue;
      const response = await httpClient.sendRequest<{
        accounts: { accountName: string; name: string }[];
      }>({
        url: 'https://mybusinessbusinessinformation.googleapis.com/v1/accounts',
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: authProp.access_token,
        },
      });

      return {
        disabled: false,
        options: response.body.accounts.map(
          (location: { accountName: string; name: string }) => {
            return {
              label: location.accountName,
              value: location.name,
            };
          }
        ),
      };
    },
  }),
  location: Property.Dropdown({
    displayName: 'Location',
    required: true,
    refreshers: ['account'],
    options: async (propsValue) => {
      if (!propsValue['auth'] || !propsValue['account']) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select account first',
        };
      }
      const account = propsValue['account'];
      const authProp: OAuth2PropertyValue = propsValue[
        'auth'
      ] as OAuth2PropertyValue;

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
          locations: { title: string; name: string }[];
          nextPageToken?: string;
        }>({
          url: `https://mybusinessbusinessinformation.googleapis.com/v1/${account}/locations`,
          queryParams: qs,
          method: HttpMethod.GET,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: authProp.access_token,
          },
        });

        nextPageToken = response.body.nextPageToken;
        if (response.body.locations && Array.isArray(response.body.locations)) {

          for (const location of response.body.locations) {
            options.push({
              label: location.title,
              value: location.name,
            });
          }

        }
      } while (nextPageToken);

      return {
        disabled: false,
        options,
      };
    },
  }),
};

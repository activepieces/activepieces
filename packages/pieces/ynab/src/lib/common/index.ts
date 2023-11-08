import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import compact from 'lodash/compact';
import flatMap from 'lodash/flatMap';

import {
  YnabAccount,
  YnabBudget,
  YnabCategory,
  YnabCategoryGroupWithCategories,
} from './models';

const API_URL = 'https://api.youneedabudget.com/v1';

export const ynabCommon = {
  apiUrl: API_URL,
  budget: Property.Dropdown({
    displayName: 'Budget',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return errorDropdownResponse('Please connect your account');
      }

      try {
        const response = await httpClient.sendRequest<{
          data: { budgets: YnabBudget[] };
        }>({
          method: HttpMethod.GET,
          url: `${API_URL}/budgets`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth as string,
          },
        });
        if (response.status === 200) {
          return {
            disabled: false,
            options: response.body.data.budgets.map((budget) => {
              return { value: budget.id, label: budget.name };
            }),
          };
        }
      } catch (e) {
        console.debug(e);
        return errorDropdownResponse('Please check your access token');
      }

      return errorDropdownResponse();
    },
  }),
  category: Property.Dropdown({
    displayName: 'Category',
    required: true,
    refreshers: ['budget'],
    options: async ({ auth, budget }) => {
      if (!auth) {
        return errorDropdownResponse('Please connect your account');
      }

      if (!budget) {
        return errorDropdownResponse('Please select a budget first');
      }

      try {
        const response = await httpClient.sendRequest<{
          data: { category_groups: YnabCategoryGroupWithCategories[] };
        }>({
          method: HttpMethod.GET,
          url: `${API_URL}/budgets/${budget}/categories`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth as string,
          },
        });
        if (response.status === 200) {
          return {
            disabled: false,
            options: compact(
              flatMap(
                response.body.data.category_groups.map((categoryGroup) => {
                  if (
                    categoryGroup.hidden ||
                    categoryGroup.deleted ||
                    categoryGroup.name.includes('Internal')
                  ) {
                    return undefined;
                  }

                  return categoryGroup.categories.map((category) => {
                    if (category.hidden || category.deleted) {
                      return undefined;
                    }

                    return {
                      value: category.id,
                      label: category.name,
                    };
                  });
                })
              )
            ),
          };
        }
      } catch (e) {
        console.debug(e);
        return errorDropdownResponse('Please check your access token');
      }

      return {
        disabled: true,
        options: [],
      };
    },
  }),
  account: Property.Dropdown({
    displayName: 'Account',
    required: true,
    refreshers: ['budget'],
    options: async ({ auth, budget }) => {
      if (!auth) {
        return errorDropdownResponse('Please connect your account');
      }

      if (!budget) {
        return errorDropdownResponse('Please select a budget first');
      }

      try {
        const response = await httpClient.sendRequest<{
          data: { accounts: YnabAccount[] };
        }>({
          method: HttpMethod.GET,
          url: `${API_URL}/budgets/${budget}/accounts`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth as string,
          },
        });
        if (response.status === 200) {
          return {
            disabled: false,
            options: response.body.data.accounts.map((account) => {
              return { value: account.id, label: account.name };
            }),
          };
        }
      } catch (e) {
        console.debug(e);
        return errorDropdownResponse('Please check your access token');
      }

      return errorDropdownResponse();
    },
  }),
  fetchCategory: async (
    options: FetchCategoryOptions
  ): Promise<YnabCategory> => {
    const response = await httpClient.sendRequest<{
      data: { category: YnabCategory };
    }>({
      method: HttpMethod.GET,
      url: `${API_URL}/budgets/${options.budget}/categories/${options.category}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: options.auth,
      },
    });

    return response.body.data.category;
  },
  toMilliUnits: (amount: number) => {
    return Math.round(amount * 1000);
  },
};

interface FetchCategoryOptions {
  auth: string;
  budget: string;
  category: string;
}

function errorDropdownResponse(placeholder?: string) {
  return {
    disabled: true,
    options: [],
    placeholder,
  };
}

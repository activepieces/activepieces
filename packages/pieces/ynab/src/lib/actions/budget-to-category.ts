import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

import { ynabAuth } from '../../index';
import { ynabCommon } from '../common';
import { YnabCategory } from '../common/models';

export const budgetToCategory = createAction({
  name: 'budget_to_category',
  auth: ynabAuth,
  displayName: 'Budget to a Category',
  description: 'Budgets an amount to a category.',
  props: {
    budget: ynabCommon.budget,
    category: ynabCommon.category,
    budgeted: Property.Number({
      displayName: 'Amount',
      required: true,
      description: 'The budgeted amount',
    }),
    month: Property.DateTime({
      displayName: 'Date',
      required: false,
      description:
        'The budget month in ISO format (e.g. 2016-12-01). Defaults to current month (UTC).',
    }),
  },
  async run(context) {
    const { budget, category, budgeted } = context.propsValue;
    const month = context.propsValue.month || 'current';
    const request: HttpRequest = {
      method: HttpMethod.PATCH,
      url: `${ynabCommon.apiUrl}/budgets/${budget}/months/${month}/categories/${category}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth as string,
      },
      body: { category: { budgeted: ynabCommon.toMilliUnits(budgeted) } },
    };

    const response = await httpClient.sendRequest<{
      data: { category: YnabCategory };
    }>(request);

    if (response.status === 200) {
      return response.body;
    }

    return response;
  },
});

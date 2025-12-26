import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const updatePortfolioLoan = createAction({
  auth: sageworksAuth,
  name: 'portfolio_loan_update',
  displayName: 'Portfolio Loan - Update',
  description: 'Update an existing portfolio loan',
  props: {
    id: Property.ShortText({
      displayName: 'Portfolio Loan ID',
      required: true,
      description: 'The ID of the portfolio loan to update',
    }),
    data: Property.Json({
      displayName: 'Portfolio Loan Data',
      required: true,
      description: 'Portfolio loan information to update as JSON object',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { id, data } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      `/v1/portfolio-loans/${id}`,
      HttpMethod.PATCH,
      data
    );
  },
});

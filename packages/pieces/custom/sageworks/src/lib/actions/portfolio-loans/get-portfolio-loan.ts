import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const getPortfolioLoan = createAction({
  auth: sageworksAuth,
  name: 'portfolio_loan_get',
  displayName: 'Portfolio Loan - Get',
  description: 'Retrieve a portfolio loan by ID',
  props: {
    id: Property.ShortText({
      displayName: 'Portfolio Loan ID',
      required: true,
      description: 'The ID of the portfolio loan to retrieve',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { id } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      `/v1/portfolio-loans/${id}`,
      HttpMethod.GET
    );
  },
});

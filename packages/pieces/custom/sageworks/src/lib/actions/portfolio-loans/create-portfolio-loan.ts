import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const createPortfolioLoan = createAction({
  auth: sageworksAuth,
  name: 'portfolio_loan_create',
  displayName: 'Portfolio Loan - Create',
  description: 'Create a new portfolio loan',
  props: {
    data: Property.Json({
      displayName: 'Portfolio Loan Data',
      required: true,
      description: 'Portfolio loan information as JSON object',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { data } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      '/v1/portfolio-loans',
      HttpMethod.POST,
      data
    );
  },
});

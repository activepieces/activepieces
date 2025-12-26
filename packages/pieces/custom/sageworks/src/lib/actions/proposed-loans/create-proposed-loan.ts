import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const createProposedLoan = createAction({
  auth: sageworksAuth,
  name: 'proposed_loan_create',
  displayName: 'Proposed Loan - Create',
  description: 'Create a new proposed loan',
  props: {
    data: Property.Json({
      displayName: 'Proposed Loan Data',
      required: true,
      description: 'Proposed loan information as JSON object',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { data } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      '/v1/proposed-loans',
      HttpMethod.POST,
      data
    );
  },
});

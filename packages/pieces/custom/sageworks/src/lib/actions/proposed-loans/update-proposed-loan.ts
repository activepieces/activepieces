import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateProposedLoan = createAction({
  auth: sageworksAuth,
  name: 'proposed_loan_update',
  displayName: 'Proposed Loan - Update',
  description: 'Update an existing proposed loan',
  props: {
    id: Property.ShortText({
      displayName: 'Proposed Loan ID',
      required: true,
      description: 'The ID of the proposed loan to update',
    }),
    data: Property.Json({
      displayName: 'Proposed Loan Data',
      required: true,
      description: 'Proposed loan information to update as JSON object',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { id, data } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      `/v1/proposed-loans/${id}`,
      HttpMethod.PATCH,
      data
    );
  },
});

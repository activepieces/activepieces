import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const getProposedLoan = createAction({
  auth: sageworksAuth,
  name: 'proposed_loan_get',
  displayName: 'Proposed Loan - Get',
  description: 'Retrieve a proposed loan by ID',
  props: {
    id: Property.ShortText({
      displayName: 'Proposed Loan ID',
      required: true,
      description: 'The ID of the proposed loan to retrieve',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { id } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      `/v1/proposed-loans/${id}`,
      HttpMethod.GET
    );
  },
});

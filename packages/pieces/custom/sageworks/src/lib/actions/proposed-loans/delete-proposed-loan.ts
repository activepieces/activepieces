import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteProposedLoan = createAction({
  auth: sageworksAuth,
  name: 'proposed_loan_delete',
  displayName: 'Proposed Loan - Delete',
  description: 'Delete a proposed loan by ID',
  props: {
    id: Property.ShortText({
      displayName: 'Proposed Loan ID',
      required: true,
      description: 'The ID of the proposed loan to delete',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { id } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      `/v1/proposed-loans/${id}`,
      HttpMethod.DELETE
    );
  },
});

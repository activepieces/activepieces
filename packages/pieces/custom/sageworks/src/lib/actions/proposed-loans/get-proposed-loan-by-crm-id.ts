import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const getProposedLoanByCrmId = createAction({
  auth: sageworksAuth,
  name: 'proposed_loan_get_by_crm_id',
  displayName: 'Proposed Loan - Get by CRM ID',
  description: 'Retrieve a proposed loan by CRM identifier',
  props: {
    crmIdentifier: Property.ShortText({
      displayName: 'CRM Identifier',
      required: true,
      description: 'The CRM identifier of the proposed loan to retrieve',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { crmIdentifier } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      `/v1/proposed-loans/crm-identifier/${crmIdentifier}`,
      HttpMethod.GET
    );
  },
});

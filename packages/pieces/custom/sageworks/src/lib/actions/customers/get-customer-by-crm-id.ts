import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const getCustomerByCrmId = createAction({
  auth: sageworksAuth,
  name: 'customer_get_by_crm_id',
  displayName: 'Customer - Get by CRM ID',
  description: 'Retrieve a customer by CRM identifier',
  props: {
    crmIdentifier: Property.ShortText({
      displayName: 'CRM Identifier',
      required: true,
      description: 'The CRM identifier of the customer to retrieve',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { crmIdentifier } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      `/v1/customers/crm-identifier/${crmIdentifier}`,
      HttpMethod.GET
    );
  },
});

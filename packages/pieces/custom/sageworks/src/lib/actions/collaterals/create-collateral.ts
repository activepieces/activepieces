import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const createCollateral = createAction({
  auth: sageworksAuth,
  name: 'collateral_create',
  displayName: 'Collateral - Create',
  description: 'Create a new collateral',
  props: {
    data: Property.Json({
      displayName: 'Collateral Data',
      required: true,
      description: 'Collateral information as JSON object',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { data } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      '/v1/collaterals',
      HttpMethod.POST,
      data
    );
  },
});

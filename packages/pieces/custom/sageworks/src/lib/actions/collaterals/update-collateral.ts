import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateCollateral = createAction({
  auth: sageworksAuth,
  name: 'collateral_update',
  displayName: 'Collateral - Update',
  description: 'Update an existing collateral',
  props: {
    id: Property.ShortText({
      displayName: 'Collateral ID',
      required: true,
      description: 'The ID of the collateral to update',
    }),
    data: Property.Json({
      displayName: 'Collateral Data',
      required: true,
      description: 'Collateral information to update as JSON object',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { id, data } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      `/v1/collaterals/${id}`,
      HttpMethod.PATCH,
      data
    );
  },
});

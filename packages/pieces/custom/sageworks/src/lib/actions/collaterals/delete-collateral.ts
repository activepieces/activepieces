import { createAction, Property } from '@activepieces/pieces-framework';
import { sageworksAuth, SageworksAuth } from '../../common/auth';
import { makeSageworksRequest } from '../../common/helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteCollateral = createAction({
  auth: sageworksAuth,
  name: 'collateral_delete',
  displayName: 'Collateral - Delete',
  description: 'Delete a collateral by ID',
  props: {
    id: Property.ShortText({
      displayName: 'Collateral ID',
      required: true,
      description: 'The ID of the collateral to delete',
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const sageworksAuth = auth as unknown as SageworksAuth;
    const { id } = propsValue;

    return await makeSageworksRequest(
      sageworksAuth,
      `/v1/collaterals/${id}`,
      HttpMethod.DELETE
    );
  },
});

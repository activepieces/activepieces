import { createAction, Property } from '@activepieces/pieces-framework';
import { callFiservApi } from '../../../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { fiservAuth } from '../../../common/auth';
import { ENDPOINTS } from '../../../common/constants';

export const deleteCollateral = createAction({
  name: 'collateral_delete',
  displayName: 'Collateral - Delete',
  description: 'Delete collateral from a loan in Fiserv',
  auth: fiservAuth,
  props: {
    collateralId: Property.ShortText({
      displayName: 'Collateral ID',
      description: 'The ID of the collateral to delete',
      required: true,
    }),

    reason: Property.LongText({
      displayName: 'Deletion Reason',
      description: 'Reason for deleting the collateral',
      required: false,
    }),
  },

  async run(context) {
    const { collateralId, reason } = context.propsValue;
    const auth = context.auth as any;

    const requestBody: any = {
      CollateralKeys: {
        CollateralId: collateralId,
      },
    };

    if (reason) {
      requestBody.DeletionReason = reason;
    }

    const response = await callFiservApi(
      HttpMethod.PUT,
      auth,
      ENDPOINTS.COLLATERAL_DELETE,
      requestBody
    );

    return response.body;
  },
});

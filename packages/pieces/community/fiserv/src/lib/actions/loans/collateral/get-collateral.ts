import { createAction, Property } from '@activepieces/pieces-framework';
import { callFiservApi } from '../../../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { fiservAuth } from '../../../common/auth';
import { ENDPOINTS } from '../../../common/constants';

export const getCollateral = createAction({
  name: 'collateral_get',
  displayName: 'Collateral - Get',
  description: 'Retrieve collateral information from Fiserv',
  auth: fiservAuth,
  props: {
    collateralId: Property.ShortText({
      displayName: 'Collateral ID',
      description: 'The ID of the collateral to retrieve',
      required: true,
    }),

    loanId: Property.ShortText({
      displayName: 'Loan ID',
      description: 'The ID of the associated loan',
      required: false,
    }),
  },

  async run(context) {
    const { collateralId, loanId } = context.propsValue;
    const auth = context.auth as any;

    const requestBody: any = {
      CollateralKeys: {
        CollateralId: collateralId,
      },
    };

    if (loanId) {
      requestBody.LoanKeys = {
        LoanId: loanId,
      };
    }

    const response = await callFiservApi(
      HttpMethod.POST,
      auth,
      ENDPOINTS.COLLATERAL_GET,
      requestBody
    );

    return response.body;
  },
});

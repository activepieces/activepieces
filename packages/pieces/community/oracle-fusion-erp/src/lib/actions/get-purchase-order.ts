import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oracleFusionErpAuth } from '../../index';
import { makeOracleApiCall } from '../common';
import { OracleFusionAuth } from '../auth';

export const getPurchaseOrderAction = createAction({
  auth: oracleFusionErpAuth,
  name: 'get_purchase_order',
  displayName: 'Get Purchase Order',
  description: 'Retrieve purchase order information by PO ID',
  props: {
    poId: Property.ShortText({
      displayName: 'Purchase Order ID',
      description: 'The unique identifier for the purchase order',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as OracleFusionAuth;
    const { poId } = context.propsValue;

    return await makeOracleApiCall(
      auth,
      `/purchaseOrders/${encodeURIComponent(poId)}`,
      HttpMethod.GET
    );
  },
});

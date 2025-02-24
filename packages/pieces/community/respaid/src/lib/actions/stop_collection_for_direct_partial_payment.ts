import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { respaidAuth } from '../..';
import { respaidCommon, respaidActionsCommon } from '../common';


export const stopCollectionForDirectPartialPayment = createAction({
  name: 'stop_collection_for_direct_partial_payment',
  displayName: 'Stop Collection for Direct Partial Payment',
  description: 'Stops the collection process for a case and mark it as partially paid directly to the creditor.',
  auth: respaidAuth,
  props: {
      unique_identifier: Property.ShortText({
        displayName: 'Unique Identifier',
        required: false,
      }),
      amount: Property.ShortText({
        displayName: 'Amount',
        required: false,
      }),
      email: Property.ShortText({
        displayName: 'Email',
        required: false,
      }),
      invoice_number: Property.ShortText({
        displayName: 'Invoice Number',
        required: false,
      }),
  },
  async run({ auth, propsValue }) {
    respaidActionsCommon.validateProps(propsValue);

    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: `${respaidCommon.baseUrl}/actions/stop_collection_for_direct_partial_payment`,
      headers: respaidCommon.getHeadersStructure(auth),
      body: respaidActionsCommon.getPayloadBodyStructure(propsValue),
    });

    return res.body;
  },
});

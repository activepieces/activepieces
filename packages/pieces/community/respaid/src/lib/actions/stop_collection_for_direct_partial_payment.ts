import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { respaidAuth } from '../auth';
import { respaidCommon, respaidActionsCommon } from '../common';


export const stopCollectionForDirectPartialPayment = createAction({
  name: 'stop_collection_for_direct_partial_payment',
  displayName: 'Stop Collection for Direct Partial Payment',
  description: 'Stops the collection process for a case and mark it as partially paid directly to the creditor.',
  audience: 'both',
  aiMetadata: { description: 'Halts the Respaid collection process for a single case and records a partial payment made directly to the creditor (outside Respaid), passing the paid amount. Use when a debtor settled part of the invoice with the creditor directly. The case must be identified by either unique_identifier or email (one is required); it records a payment and mutates case state, so it is not idempotent.', idempotent: false },
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
      headers: respaidCommon.getHeadersStructure(auth.secret_text),
      body: respaidActionsCommon.getPayloadBodyStructure(propsValue),
    });

    return res.body;
  },
});

import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { respaidAuth } from '../auth';
import { respaidCommon, respaidActionsCommon } from '../common';


export const stopCollectionForDirectInstalmentPayment = createAction({
  name: 'stop_collection_for_direct_instalment_payment',
  displayName: 'Stop Collection for Direct Instalment Payment',
  description: 'Stops the collection process for a case when an instalment plan is set up with the creditor.',
  audience: 'both',
  aiMetadata: { description: 'Halts the Respaid collection process for a single case because the debtor and creditor agreed on a direct instalment (payment plan) arrangement. Use when collection should pause in favour of a creditor-side instalment plan rather than full settlement. The case must be identified by either unique_identifier or email (one is required); it mutates case state, so it is not idempotent.', idempotent: false },
  auth: respaidAuth,
  props: {
    unique_identifier: Property.ShortText({
      displayName: 'Unique Identifier',
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
      url: `${respaidCommon.baseUrl}/actions/stop_collection_for_direct_instalment_payment`,
      headers: respaidCommon.getHeadersStructure(auth.secret_text),
      body: respaidActionsCommon.getPayloadBodyStructure(propsValue),
    });
    return res.body;
  },
});

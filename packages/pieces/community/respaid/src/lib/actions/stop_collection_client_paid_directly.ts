import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { respaidAuth } from '../auth';
import { respaidCommon, respaidActionsCommon } from '../common';


export const stopCollectionClientPaidDirectly = createAction({
  name: 'stop_collection_client_paid_directly',
  displayName: 'Stop Collection for Direct Full Payment',
  description: 'Stops the collection process for a case and mark it as paid directly to the creditor.',
  audience: 'both',
  aiMetadata: { description: 'Halts the Respaid collection process for a single case and marks the debt as paid in full directly to the creditor (outside Respaid). Use when a debtor settled the invoice with the creditor directly. The case must be identified by either unique_identifier or email (one is required); it mutates case state, so it is not idempotent.', idempotent: false },
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
      url: `${respaidCommon.baseUrl}/actions/stop_collection_client_paid_directly`,
      headers: respaidCommon.getHeadersStructure(auth.secret_text),
      body: respaidActionsCommon.getPayloadBodyStructure(propsValue),
    });
    return res.body;
  },
});

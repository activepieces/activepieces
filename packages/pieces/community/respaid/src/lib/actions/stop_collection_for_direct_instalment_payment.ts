import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { respaidAuth } from '../..';
import { respaidCommon, respaidActionsCommon } from '../common';


export const stopCollectionForDirectInstalmentPayment = createAction({
  name: 'stop_collection_for_direct_instalment_payment',
  displayName: 'Stop Collection for Direct Instalment Payment',
  description: 'Stops the collection process for a case when an instalment plan is set up with the creditor.',
  auth: respaidAuth,
  props: {
    unique_identifier: Property.ShortText({
      displayName: 'Unique Identifier',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    if (!propsValue.unique_identifier && !propsValue.email) {
      throw new Error('At least one of unique_identifier and email must be provided.');
    }

    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: `${respaidCommon.baseUrl}/actions/stop_collection_for_direct_instalment_payment`,
      headers: respaidCommon.getHeadersStructure(auth),
      body: respaidActionsCommon.getPayloadBodyStructure(propsValue),
    });
    return res.body;
  },
});
